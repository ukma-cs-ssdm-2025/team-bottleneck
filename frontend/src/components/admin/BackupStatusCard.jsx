import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Button } from '@mui/material';
import { getBackupLogs } from '../../api/adminAPI';

const BackupStatusCard = () => {
    const [latestBackup, setLatestBackup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBackupStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getBackupLogs();

            const data = response.data.results ? response.data.results : response.data;

            if (data && data.length > 0) {
                setLatestBackup(data[0]);
            } else {
                setLatestBackup(null);
            }
        } catch (err) {
            console.error("Failed to fetch backup logs", err);
            setError("Не вдалося отримати статус бекапів");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackupStatus();
    }, []);

    if (loading && !latestBackup) {
        return (
            <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={20} />
            </Box>
        );
    }

    if (!latestBackup) {
        return (
            <Card sx={{
                minWidth: 275,
                border: '1px solid #9e9e9e',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
                <CardContent>
                    <Typography variant="h6" component="div" mb={1} sx={{ fontWeight: 600 }}>
                        Статус Бекапу БД
                    </Typography>
                    <Typography color="text.secondary">
                        Інформація про бекапи недоступна
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    const isSuccess = latestBackup.status === 'SUCCESS';
    const date = new Date(latestBackup.created_at).toLocaleString('uk-UA');

    return (
        <Card sx={{
            minWidth: 275,
            border: isSuccess ? '2px solid #4caf50' : '2px solid #f44336',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                        Статус Бекапу БД
                    </Typography>
                    <Button
                        size="small"
                        onClick={fetchBackupStatus}
                        variant="outlined"
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            minWidth: '100px'
                        }}
                    >
                        Оновити
                    </Button>
                </Box>

                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box
                        sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            backgroundColor: isSuccess ? '#e8f5e9' : '#ffebee',
                            color: isSuccess ? '#2e7d32' : '#c62828',
                            fontWeight: 600,
                            fontSize: '0.875rem'
                        }}
                    >
                        {isSuccess ? 'Успішно' : 'Помилка'}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {date}
                    </Typography>
                </Box>

                {latestBackup.message && (
                    <Typography
                        variant="body2"
                        sx={{
                            fontFamily: 'monospace',
                            backgroundColor: '#f5f5f5',
                            p: 1.5,
                            borderRadius: 2,
                            fontSize: '0.8rem',
                            wordBreak: 'break-all',
                            color: '#424242'
                        }}
                    >
                        {latestBackup.message}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default BackupStatusCard;