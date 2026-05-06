const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Log = require('../logging_middleware/logger');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// In-memory data storage for this stage
let notifications = [
    {
        id: uuidv4(),
        category: 'social',
        source: 'whatsapp',
        priority: 'high',
        title: 'New Message from Raj',
        message: 'Hey, are we still meeting at 5?',
        is_read: false,
        created_at: new Date().toISOString(),
        actions: [{ label: 'Reply', url: '/chat/raj', type: 'link' }]
    }
];

// SSE Clients
let clients = [];

// Helper to push to all SSE clients
const pushToClients = (data) => {
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
};

// 1. Fetch Notifications
app.get('/api/notifications', async (req, res) => {
    try {
        const { category, is_read } = req.query;
        let filtered = [...notifications];

        if (category) filtered = filtered.filter(n => n.category === category);
        if (is_read !== undefined) {
            const isReadBool = is_read === 'true';
            filtered = filtered.filter(n => n.is_read === isReadBool);
        }

        await Log('backend', 'info', 'controller', `Fetched ${filtered.length} notifications`);
        res.json({ success: true, data: filtered, total: filtered.length });
    } catch (error) {
        await Log('backend', 'error', 'controller', `Fetch error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Create Notification
app.post('/api/notifications', async (req, res) => {
    try {
        const { category, priority, title, message, source } = req.body;
        const newNotif = {
            id: uuidv4(),
            category: category || 'general',
            source: source || 'system',
            priority: priority || 'normal',
            title,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            actions: []
        };

        notifications.push(newNotif);
        pushToClients(newNotif);

        await Log('backend', 'info', 'service', `Created notification: ${newNotif.id}`);
        res.status(201).json({ success: true, id: newNotif.id, message: 'Notification created' });
    } catch (error) {
        await Log('backend', 'error', 'service', `Creation error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Get Unread Count
app.get('/api/notifications/unread-count', async (req, res) => {
    try {
        const count = notifications.filter(n => !n.is_read).length;
        await Log('backend', 'info', 'controller', `Unread count check: ${count}`);
        res.json({ success: true, unread_count: count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Mark as Read
app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const index = notifications.findIndex(n => n.id === id);
        if (index === -1) return res.status(404).json({ success: false, message: 'Not found' });

        notifications[index].is_read = true;
        await Log('backend', 'info', 'controller', `Marked as read: ${id}`);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Delete Notification
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        notifications = notifications.filter(n => n.id !== id);
        await Log('backend', 'info', 'controller', `Deleted notification: ${id}`);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. Real-time SSE Stream
app.get('/api/notifications/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    Log('backend', 'info', 'api', `Client connected to SSE: ${clientId}`);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
        Log('backend', 'info', 'api', `Client disconnected from SSE: ${clientId}`);
    });
});

// --- STAGE 5: Notify All (Asynchronous Simulation) ---
app.post('/api/notify-all', async (req, res) => {
    const { student_ids, message } = req.body;
    
    if (!student_ids || !Array.isArray(student_ids)) {
        return res.status(400).json({ success: false, message: 'Invalid student IDs' });
    }

    // Acknowledge immediately (Asynchronous simulation)
    res.json({ success: true, message: 'Mass notification queued', total: student_ids.length });

    await Log('backend', 'info', 'service', `Starting mass notification for ${student_ids.length} users`);

    // Process in batches to avoid blocking
    const batchSize = 100;
    for (let i = 0; i < student_ids.length; i += batchSize) {
        const batch = student_ids.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (id) => {
            try {
                // Mocking the steps
                // 1. Save to DB
                const notif = {
                    id: uuidv4(),
                    category: 'update',
                    title: 'Mass Notification',
                    message,
                    is_read: false,
                    created_at: new Date().toISOString()
                };
                notifications.push(notif);

                // 2. Mock Email Send
                // await sendEmail(id, message);

                // 3. Push to individual via SSE (if client exists)
                // pushToClient(id, notif);

            } catch (err) {
                await Log('backend', 'error', 'service', `Failed for student ${id}: ${err.message}`);
            }
        }));

        // Subtle delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    await Log('backend', 'info', 'service', `Completed mass notification task`);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    Log('backend', 'info', 'config', `Server started on port ${PORT}`);
});
