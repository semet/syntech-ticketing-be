const activeConnections = new Set();
export const IssueStreamController = async (c) => {
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Headers', '*');
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    const stream = new ReadableStream({
        start(controller) {
            activeConnections.add(controller);
            controller.enqueue(`data: ${JSON.stringify({
                type: 'connected',
                message: 'Issue stream connected',
                timestamp: new Date().toISOString(),
            })}\n\n`);
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(`data: ${JSON.stringify({
                        type: 'heartbeat',
                        timestamp: new Date().toISOString(),
                    })}\n\n`);
                }
                catch {
                    clearInterval(heartbeat);
                    activeConnections.delete(controller);
                }
            }, 30_000);
            controller.cleanup = () => {
                clearInterval(heartbeat);
                activeConnections.delete(controller);
            };
        },
        cancel() {
            console.log('Issue SSE connection cancelled');
        },
    });
    return new Response(stream);
};
export const broadcastIssueUpdate = (issue, action = 'updated') => {
    const message = `data: ${JSON.stringify({
        type: 'issue_update',
        action,
        data: issue,
        timestamp: new Date().toISOString(),
    })}\n\n`;
    for (const controller of activeConnections) {
        try {
            controller.enqueue(message);
        }
        catch {
            activeConnections.delete(controller);
            console.log('Removed closed SSE connection');
        }
    }
    console.log(`Broadcasted ${action} for issue ${issue.id} to ${activeConnections.size} clients`);
};
export const broadcastIssueDeletion = (issueId) => {
    const message = `data: ${JSON.stringify({
        type: 'issue_update',
        action: 'deleted',
        data: { id: issueId },
        timestamp: new Date().toISOString(),
    })}\n\n`;
    for (const controller of activeConnections) {
        try {
            controller.enqueue(message);
        }
        catch {
            activeConnections.delete(controller);
        }
    }
    console.log(`Broadcasted deletion for issue ${issueId} to ${activeConnections.size} clients`);
};
export const getActiveConnectionCount = () => activeConnections.size;
export const closeAllIssueConnections = () => {
    for (const controller of activeConnections) {
        try {
            controller.close();
        }
        catch {
            // Connection already closed
        }
    }
    activeConnections.clear();
    console.log('All issue SSE connections closed');
};
//# sourceMappingURL=issue-stream-controller.js.map