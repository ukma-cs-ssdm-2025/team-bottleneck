import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, CircularProgress, Button } from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
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
        return <CircularProgress size={20} />;
    }

    if (!latestBackup) {
        return <Typography color="text.secondary">No backup information available</Typography>;
    }

    const isSuccess = latestBackup.status === 'SUCCESS';
    const date = new Date(latestBackup.created_at).toLocaleString('uk-UA');

    return (
        <Card sx={{ minWidth: 275, border: isSuccess ? '1px solid #4caf50' : '1px solid #f44336' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" component="div">
                        Статус Бекапу БД
                    </Typography>
                    <Button startIcon={<RefreshIcon />} size="small" onClick={fetchBackupStatus}>
                        Оновити
                    </Button>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {isSuccess ? (
                        <Chip 
                            icon={<CloudDoneIcon />} 
                            label="Успішно" 
                            color="success" 
                            variant="outlined" 
                        />
                    ) : (
                        <Chip 
                            icon={<ErrorIcon />} 
                            label="Помилка" 
                            color="error" 
                            variant="filled" 
                        />
                    )}
                    <Typography variant="body2" color="text.secondary">
                        {date}
                    </Typography>
                </Box>

                <Typography variant="body2" sx={{ 
                    fontFamily: 'monospace', 
                    backgroundColor: '#f5f5f5', 
                    p: 1, 
                    borderRadius: 1,
                    fontSize: '0.8rem',
                    wordBreak: 'break-all'
                }}>
                    {latestBackup.message}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default BackupStatusCard;