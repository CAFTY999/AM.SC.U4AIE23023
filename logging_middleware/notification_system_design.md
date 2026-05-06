# Stage 1

## Notification System Design

### 1. Overview
The notification system is designed to deliver all types of notifications to users across multiple communication channels in real-time. The platform ensures seamless delivery, filtering, and categorization of notifications ranging from critical security alerts to social updates and promotional content.

**Key Delivery Channels:**
*   **In-app notifications**: Displayed directly within the user interface.
*   **Push notifications**: Sent to mobile or desktop devices.
*   **SMS**: Mobile text-based alerts.
*   **Email**: Traditional electronic mail updates.

**Core Capabilities:**
*   **Notification creation & fetching**: Robust lifecycle management.
*   **Real-time delivery**: Instant updates via SSE.
*   **Advanced Filtering**: Filter by category, source, or read status.
*   **Priority-based delivery**: Intelligent sorting and handling.
*   **Observability**: Full integration with the reusable **Logging Middleware** for debugging and monitoring.

---

### 2. Design Specifications

#### A. Notification Categories
| Type | Description |
| :--- | :--- |
| **reminder** | Event reminders and schedules |
| **otp** | Verification and authentication OTPs |
| **promotion** | Marketing and promotional notifications |
| **personal** | Personal user-to-user notifications |
| **social** | Social activity updates |
| **update** | Score updates and application updates |
| **security** | Security alerts and suspicious activities |
| **spam** | Filtered low-priority notifications |

#### B. Notification Priority Levels
| Priority | Description |
| :--- | :--- |
| **low** | Promotional notifications |
| **medium** | General reminders and updates |
| **high** | OTPs and important alerts |
| **critical** | Security and emergency notifications |

#### C. Supported Notification Channels
| Channel | Description |
| :--- | :--- |
| **in-app** | Notifications displayed inside application |
| **push** | Push notifications to devices |
| **sms** | Mobile text notifications |
| **email** | Email-based notifications |

---

### 3. Core Actions Supported
*   **Fetch Notifications**: Retrieve a list of notifications with filtering and pagination.
*   **Unread Count**: Get a quick summary of pending notifications.
*   **Mark as Read/Unread**: Update the status of individual or multiple notifications.
*   **Delete Notification**: Permanently remove a notification.
*   **Real-time Streaming**: Receive instant updates via Server-Sent Events (SSE).

### 4. REST API Endpoints

#### A. Fetch Notifications
*   **Endpoint**: `GET /api/notifications`
*   **Description**: Retrieves a list of notifications with filtering and pagination.
*   **Headers**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <token>`
*   **Request (Query Params)**:
    *   `category`: String (e.g., `urgent`, `social`)
    *   `is_read`: Boolean
    *   `limit`: Integer (Default: 20)
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "id": "1", "title": "Welcome", "message": "Thanks for joining!", "is_read": false }
      ],
      "total": 1
    }
    ```

#### B. Create Notification (System/Internal)
*   **Endpoint**: `POST /api/notifications`
*   **Description**: Creates a new notification.
*   **Headers**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <token>`
*   **Request (Body)**:
    ```json
    {
      "category": "social",
      "priority": "medium",
      "channel": "in-app",
      "title": "New Like",
      "message": "Raj liked your photo"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "id": "notif_101",
      "message": "Notification created successfully"
    }
    ```

#### C. Get Unread Count
*   **Endpoint**: `GET /api/notifications/unread-count`
*   **Description**: Returns the count of notifications not yet read.
*   **Headers**:
    *   `Authorization: Bearer <token>`
*   **Request**: None
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "unread_count": 5
    }
    ```

#### D. Mark as Read
*   **Endpoint**: `PATCH /api/notifications/:id/read`
*   **Description**: Updates a notification status to "read".
*   **Headers**:
    *   `Authorization: Bearer <token>`
*   **Request**: None (ID in URL)
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Status updated"
    }
    ```

#### E. Delete Notification
*   **Endpoint**: `DELETE /api/notifications/:id`
*   **Description**: Removes a notification.
*   **Headers**:
    *   `Authorization: Bearer <token>`
*   **Request**: None (ID in URL)
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Deleted successfully"
    }
    ```

### 5. Real-time Notification Mechanism
The system will use **Server-Sent Events (SSE)** for real-time delivery.
*   **Endpoint**: `GET /api/notifications/stream`
*   **Headers**: `Accept: text/event-stream`
*   **Mechanism**: The server maintains an open connection and pushes new notifications as they occur. SSE is preferred over WebSockets for this use case as it is unidirectional (Server to Client), lightweight, and supports automatic reconnection.

### 6. Data Schema (JSON)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique UUID for the notification. |
| `category` | Enum | `urgent`, `social`, `promotions`, `updates`, `spam`, `personal`. |
| `source` | String | Originating app (e.g., "WhatsApp", "Instagram", "OTP_Service"). |
| `priority` | String | `critical`, `high`, `normal`, `low`. |
| `title` | String | Short headline for the notification. |
| `message` | String | Detailed content/body. |
| `is_read` | Boolean | Status flag. |
| `metadata` | Object | Flexible key-value pairs for source-specific data (e.g., `sender_id`, `score`). |
| `actions` | Array | List of interactive buttons/links (e.g., "Copy OTP", "View Score"). |

### 7. Logging Strategy
All API interactions and real-time events **MUST** be logged using the `Logging_Middleware`.
*   **Requests**: Log method, endpoint, and user context.
*   **Streaming**: Log when a client connects/disconnects to the SSE stream.
*   **Lifecycle**: Log when a notification is created, read, or deleted.
*   **Example**: `[INFO] [2024-05-06T15:20:00Z] GET /api/notifications - User: Authorized - Status: 200`

---
# Stage 2

## 1. Database Choice: MongoDB (NoSQL)
For a notification system, MongoDB will be my choice as it can support data in any format

### Rationale:
*   **Schema Flexibility**: Notifications come from various sources (WhatsApp, Insta, OTPs) with different metadata. A document-oriented DB allows us to store these without rigid migrations.
*   **High Write Throughput**: Notification systems are write-heavy (bursts of alerts). MongoDB is optimized for high-speed inserts.
*   **Horizontal Scalability**: As the user base grows, MongoDB's sharding capabilities allow us to distribute data across multiple servers easily.

---

## 2. Database Schema
We will use a `notifications` collection with the following structure:

```javascript
{
  "_id": ObjectId("..."),
  "user_id": "user_1",          // Indexed: Crucial for fetching user-specific alerts
  "category": "urgent",           // Indexed: For filtering (reminder, otp, social, etc.)
  "priority": "high",             // (critical, high, medium, low)
  "channel": "push",              // (in-app, push, sms, email)
  "title": "Security Alert",
  "message": "New login detected from Mumbai.",
  "is_read": false,               // Indexed: To quickly count unread notifications
  "created_at": ISODate("..."),   // Indexed: For sorting by most recent
  "metadata": {                   // Flexible object for source-specific data
    "device_id": "IPHONE_15",
    "location": "Mumbai, IN"
  }
}
```

---

## 3. Scalability: Problems and Solutions

### Potential Problems at Scale:
1.  **Massive Data Volume**: Millions of notifications generated daily can lead to slow queries and high storage costs.
2.  **Read Latency**: As the `notifications` collection grows into billions of records, simple `count` and `find` operations will slow down.
3.  **Write Bursts**: Sudden spikes (e.g., a "Flash Sale" promotion) can overwhelm the database.

### Proposed Solutions:
1.  **TTL (Time To Live) Indexes**: Implement a TTL index on the `created_at` field (e.g., 30 days). This automatically deletes old notifications, keeping the database "lean" and performant.
2.  **Indexing Strategy**: Create compound indexes like `{ user_id: 1, is_read: 1, created_at: -1 }` to ensure the "Fetch Unread" query is lightning fast.
3.  **Database Sharding**: Use `user_id` as a shard key to distribute notifications across a cluster of servers.

---

## 4. Sample Queries (NoSQL)

#### A. Fetching Latest Notifications
```javascript
db.notifications.find({ 
    user_id: "user_789", 
    is_read: false 
})
.sort({ created_at: -1 })
.limit(20);
```

#### B. Getting Unread Count
```javascript
db.notifications.countDocuments({ 
    user_id: "user_789", 
    is_read: false 
});
```

#### C. Marking All as Read
```javascript
db.notifications.updateMany(
    { user_id: "user_789", is_read: false },
    { $set: { is_read: true, updated_at: new Date() } }
);
```

#### D. Deleting Old Notifications (Manual fallback to TTL)
```javascript
db.notifications.deleteMany({ 
    created_at: { $lt: new Date(Date.now() - 30*24*60*60*1000) } 
});
```
