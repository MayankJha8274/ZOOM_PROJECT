/**
 * ATTENDANCE HISTORY PAGE - AttendanceHistory.jsx
 * Shows attendance reports for meetings owned by the logged-in user
 */

import React, { useEffect, useState, useContext } from 'react';
import { 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Collapse,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { AuthContext } from '../contexts/AuthContext';
import server from '../environment';

export default function AttendanceHistory() {
  const { userId } = useContext(AuthContext) || {};
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReports, setExpandedReports] = useState({});

  useEffect(() => {
    fetchAttendanceReports();
  }, [userId]);

  const fetchAttendanceReports = async () => {
    if (!userId) {
      setError('Please log in to view attendance reports');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${server}/api/v1/attendance/owner/${userId}`);
      const data = await response.json();

      if (data.success) {
        setReports(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching attendance reports:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (reportId) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'success';
      case 'Partial':
        return 'warning';
      case 'Absent':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateSummary = (participants) => {
    const present = participants.filter(p => p.status === 'Present').length;
    const partial = participants.filter(p => p.status === 'Partial').length;
    const absent = participants.filter(p => p.status === 'Absent').length;
    return { present, partial, absent, total: participants.length };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading attendance reports...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchAttendanceReports} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        📊 My Meeting Attendance Reports
      </Typography>
      
      {reports.length === 0 ? (
        <Alert severity="info">
          No attendance reports found. You haven't hosted any meetings with attendance tracking yet.
        </Alert>
      ) : (
        <Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Showing {reports.length} meeting report{reports.length !== 1 ? 's' : ''}
          </Typography>

          {reports.map((report) => {
            const summary = calculateSummary(report.participants);
            const isExpanded = expandedReports[report._id];

            return (
              <Card key={report._id} sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        Meeting: {report.meetingId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {formatDate(report.date)}
                      </Typography>
                      {report.startTime && report.endTime && (
                        <Typography variant="body2" color="text.secondary">
                          Duration: {formatDate(report.startTime)} - {formatDate(report.endTime)}
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Chip 
                          label={`${summary.present} Present`} 
                          color="success" 
                          size="small" 
                        />
                        <Chip 
                          label={`${summary.partial} Partial`} 
                          color="warning" 
                          size="small" 
                        />
                        <Chip 
                          label={`${summary.absent} Absent`} 
                          color="error" 
                          size="small" 
                        />
                        <Chip 
                          label={`${summary.total} Total`} 
                          variant="outlined" 
                          size="small" 
                        />
                      </Box>
                    </Box>
                    
                    <IconButton onClick={() => toggleExpand(report._id)}>
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={isExpanded}>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Participant Details:
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>User</strong></TableCell>
                              <TableCell align="center"><strong>Verified %</strong></TableCell>
                              <TableCell align="center"><strong>Total Time (s)</strong></TableCell>
                              <TableCell align="center"><strong>Verified Time (s)</strong></TableCell>
                              <TableCell align="center"><strong>Status</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {report.participants.map((participant, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{participant.name}</TableCell>
                                <TableCell align="center">
                                  {participant.verifiedPercent}%
                                </TableCell>
                                <TableCell align="center">
                                  {participant.totalTime || 'N/A'}
                                </TableCell>
                                <TableCell align="center">
                                  {participant.verifiedTime || 'N/A'}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={participant.status} 
                                    color={getStatusColor(participant.status)}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Attendance Criteria:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          ✅ <strong>Present:</strong> Face detected ≥ 75% of time
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          ⚠️ <strong>Partial:</strong> Face detected ≥ 50% but &lt; 75% of time
                        </Typography>
                        <Typography variant="body2">
                          ❌ <strong>Absent:</strong> Face detected &lt; 50% of time
                        </Typography>
                      </Box>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Container>
  );
}
