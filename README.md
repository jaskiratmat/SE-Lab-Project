# HomeLabOS: Production-Grade Infrastructure Management System (Proof-of-Concept)

[![Platform: Browser Native](https://img.shields.io/badge/Platform-Static%20Web%20%2F%20GitHub%20Pages-blue.svg)](https://pages.github.com/)
[![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-38bdf8.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20External%20Libraries-10b981.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](#)

A modern, responsive, zero-dependency single-page proof-of-concept control plane for bare-metal and virtualized homelab servers. It abstracts Linux node discovery, Docker/Podman container lifecycle orchestration, storage pool datasets (ZFS/BTRFS/EXT4), NAT port collision prevention, real-time telemetry polling, and Role-Based Access Control (RBAC).

---

## 📑 Core Functional Modules

| Module | Features & Capabilities |
| :--- | :--- |
| **1. Telemetry Dashboard** | Live multi-line HTML5 `<canvas>` rendering of fluctuating CPU, RAM, and Network I/O metrics; safety threshold alert triggers (>85% load); interactive event audit terminal drawer; quick container snapshot. |
| **2. Host Node Management** | Overview of heterogeneous server nodes (Ubuntu, Debian, TrueNAS across `x86_64` and `ARM64`); real-time core/RAM/disk capacity gauges; interactive **Active** &harr; **Maintenance** mode switcher. |
| **3. Container Orchestration** | Service lifecycle management (`Running`, `Paused`, `Stopped`, `Crashed`, `Pulling`); one-click lifecycle actions (Start, Pause, Resume, Stop, Crash Simulation, Destroy); image deployment modal with application presets (Nginx, Pi-hole, Plex, Nextcloud). |
| **4. Storage & Volume Pools** | Overview of ZFS datasets (`RAID-Z2`), BTRFS subvolumes, and EXT4 mount paths; dynamic quota usage visualization; container volume bindings; pool provisioning modal. |
| **5. Network & Port Registry** | Centralized NAT port mapping table (`80:80`, `53:53`, `32400:32400`); real-time port collision engine that actively halts deployment if a requested external port is already allocated on the target host. |
| **6. RBAC & Security** | Simulated authentication profiles for **Admin** (`Alex Vance`, Argon2id hash, TOTP active) and **Standard User** (`Jordan Lee`, Bcrypt hash); dynamic UI permission toggling; enforced authorization matrix preventing unauthorized destructive actions. |

---

## 🏛️ Software Engineering Specification & Diagrams

### 1. Architectural Overview & Context
HomeLabOS decouples the browser-based control plane from underlying daemon agents. In this client-side architecture, the central state engine interacts with a virtualized host agent abstraction, storing changes to `localStorage` for complete data persistence across browser reloads.

```mermaid
graph TD
    User([System Operator]) -->|Browser Session| UI[Single-Page Web UI: index.html]
    UI --> State[Dynamic State Controller: app.js]
    State --> Storage[(Local Memory / Browser LocalStorage)]
    
    subgraph "Simulated Homelab Abstraction Layer"
        State --> RBAC[RBAC Enforcer & Permission Matrix]
        State --> Orch[Container Orchestrator & Port Collision Guard]
        State --> NodeMgr[Host Node Discovery & Status Controller]
        State --> StoreMgr[ZFS/BTRFS Storage Mount Manager]
        State --> Telemetry[Async Telemetry Poller & Alert Thresholds]
    end
    
    Telemetry --> Canvas[HTML5 Canvas Rolling Stream]
    Orch --> Term[Live Event Terminal Log]
```

---

### 2. UML Class Diagram
The system structure enforces clean separation between User Authentication profiles, Host Nodes, Container Services, and Storage Volumes.

```mermaid
classDiagram
    class UserLogin {
        +String userId
        +String email
        +String passwordHash
        +String hashMethod
        +Boolean mfaActive
        +DateTime lastLogin
        +verifyCredentials() Boolean
        +toggleMfa() void
    }

    class AdminProfile {
        +String adminId
        +String rootAccessKey
        +executePrivilegedAction(action) Boolean
        +enrollNode(HostNode) void
        +deployContainer(ContainerService) void
    }

    class StandardUserProfile {
        +String standardId
        +List allowedActions
        +triggerRestart(containerId) Boolean
    }

    class HostNode {
        +String nodeId
        +String hostname
        +String ipAddress
        +String osVersion
        +String architecture
        +Integer cpuCores
        +Integer ramGb
        +Integer diskGb
        +String status
        +toggleMaintenance() void
        +getAvailableCapacity() Object
    }

    class ContainerService {
        +String containerId
        +String serviceName
        +String imageTag
        +String targetNodeId
        +Integer hostPort
        +Integer internalPort
        +String lifecycleState
        +String restartPolicy
        +String volumeMountId
        +String envVars
        +transitionState(action) void
    }

    class StorageVolume {
        +String volumeId
        +String volumeName
        +String filesystemType
        +String mountPath
        +Integer quotaGb
        +Integer usedGb
        +String backupCronSchedule
        +checkQuotaStatus() Float
    }

    UserLogin "1" -- "0..1" AdminProfile : 1-to-1 Profile Link
    UserLogin "1" -- "0..1" StandardUserProfile : 1-to-1 Profile Link
    HostNode "1" -- "0..*" ContainerService : Hosts
    StorageVolume "1" -- "0..*" ContainerService : Mounts To
```

---

### 3. Entity-Relationship (ER) Diagram
Primary and Foreign Key relational schema mapped across entities:

```mermaid
erDiagram
    USER_LOGIN ||--o| ADMIN_PROFILE : "has profile (1:1)"
    USER_LOGIN ||--o| STANDARD_USER_PROFILE : "has profile (1:1)"
    HOST_NODE ||--o{ CONTAINER_SERVICE : "hosts (1:N)"
    STORAGE_VOLUME ||--o{ CONTAINER_SERVICE : "mounted_by (1:N)"

    USER_LOGIN {
        string user_id PK
        string email UK
        string password_hash
        string hash_type "Argon2id or Bcrypt"
        boolean mfa_secret_active
        datetime created_at
    }

    ADMIN_PROFILE {
        string admin_id PK
        string user_id FK
        string privileges_scope
    }

    STANDARD_USER_PROFILE {
        string standard_id PK
        string user_id FK
        boolean can_restart_services
    }

    HOST_NODE {
        string node_id PK
        string hostname UK
        string ip_address
        string os_distro
        string cpu_arch "x86_64 or ARM64"
        integer cores_count
        integer ram_capacity_gb
        integer disk_capacity_gb
        string operational_status "Active or Maintenance"
    }

    CONTAINER_SERVICE {
        string service_id PK
        string service_name
        string image_tag
        string host_node_id FK
        integer host_port
        integer internal_port
        string lifecycle_state "Running, Paused, Stopped, Crashed, Pulling"
        string restart_policy
        string storage_volume_id FK
        string environment_vars
    }

    STORAGE_VOLUME {
        string volume_id PK
        string volume_name UK
        string filesystem "ZFS, BTRFS, or EXT4"
        string mount_path
        integer quota_capacity_gb
        string backup_cron
    }
```

---

### 4. Container Service Lifecycle Statechart Diagram
Models the valid state transitions for containerized applications running on the orchestration engine:

```mermaid
stateDiagram-v2
    [*] --> Initial : User Submits Form
    Initial --> PullingImage : Validated (No Port Collision)
    PullingImage --> Created : Image Downloaded from OCI Registry
    Created --> Running : Container Started (cgroups / socket API)
    
    Running --> Paused : Admin/User Triggers Pause (SIGSTOP)
    Paused --> Running : Admin/User Triggers Resume (SIGCONT)
    
    Running --> Stopped : Clean Termination (SIGTERM)
    Stopped --> Running : Admin/User Triggers Start
    
    Running --> Crashed : Unhandled OOM (SIGKILL / Exit 137)
    Crashed --> Running : Orchestrator Auto-Restart / Manual Start
    
    Stopped --> [*] : Deleted & Port Unbound
    Crashed --> [*] : Deleted & Port Unbound
```

---

### 5. Data Flow Diagrams (DFDs)

#### Level 0 DFD (Context Diagram)
```mermaid
graph TD
    User([System Operator]) -->|User Credentials & Actions| HLOS[HomeLabOS Control Plane]
    HLOS -->|Real-time Telemetry & State Updates| User
    HLOS -->|Socket API Calls| DockerDaemon[Simulated Docker Socket]
    DockerDaemon -->|Process Telemetry & Exit Codes| HLOS
```

#### Level 1 DFD (Decomposed Subsystems)
```mermaid
graph TD
    User([User]) -->|Auth Request| P1[1.0 Authenticate & RBAC Session]
    P1 -->|Session Token & Role| D1[(User & Session Store)]
    
    User -->|Node Config| P2[2.0 Host Node Lifecycle Engine]
    P2 --> D2[(Host Nodes Store)]
    
    User -->|Deploy Request| P3[3.0 Container Orchestration Engine]
    P3 -->|Check Host Ports| D3[(Port & Container Registry)]
    D3 -->|Collision Verified| P3
    P3 --> D2
    
    User -->|Provision Volume| P4[4.0 Storage Manager]
    P4 --> D4[(Storage Volumes Store)]
    
    P5[5.0 Telemetry Stream Engine] -->|Hardware Metrics & Alerts| User
    P5 --> D2
```

#### Level 2 DFD (Container Deployment & Port Collision Validation)
```mermaid
graph TD
    User([User]) -->|Inputs: Image, Node, Ports| P3_1[3.1 Parse Form & Target Node]
    P3_1 -->|Target Node ID & Host Port| P3_2{3.2 Port Collision Scanner}
    
    D_Ports[(Active Port Bindings)] -->|Allocated Ports List| P3_2
    
    P3_2 -->|Conflict Found| Err[Halt & Return Collision Alert to User]
    P3_2 -->|Port Available| P3_3[3.3 Pull Image & Bind NAT Port]
    
    P3_3 -->|Create Record| D_Containers[(Container Service DB)]
    P3_3 -->|Append Audit Event| D_Logs[(Terminal Event Log)]
    P3_3 -->|Render Updated State| User
```

---

## 🧪 Comprehensive Verification & Test Plan

The system has been evaluated against test suites verifying functional accuracy, security boundaries, and lifecycle resilience:

| Test ID | Module | Test Description | Expected Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | **RBAC** | Attempt to register a host node while switched to **Standard User** role. | System blocks modal, logs security alert to terminal, and displays access denial toast. | **PASS** |
| **TC-02** | **RBAC** | Switch session from Standard User to **Admin** via top-right menu. | All administrative actions unlocked, profile pill changes to red ADMIN, Argon2id verified. | **PASS** |
| **TC-03** | **Network** | Deploy a new service on `node-01` requesting external port `80` (already bound to Nginx). | Port Collision Scanner immediately flags port 80 in red text and disables deployment. | **PASS** |
| **TC-04** | **Container** | Trigger `Pause` and subsequent `Resume` on running container. | Container transitions to `Paused` (amber badge) and returns to `Running` (emerald badge). | **PASS** |
| **TC-05** | **Container** | Trigger `Crash` simulation on `prometheus-exporter`. | Container moves to `Crashed` state (rose badge, exit code 137), alert logged to terminal. | **PASS** |
| **TC-06** | **Nodes** | Toggle host node `node-01` into **Maintenance Mode**. | Node status reflects `Maintenance`, card receives amber glow, containers excluded from deploy. | **PASS** |
| **TC-07** | **Storage** | Provision new ZFS storage dataset `/mnt/tank/vault` with 1000 GB quota. | Storage pool card renders with real-time usage bar and automated backup cron schedule. | **PASS** |
| **TC-08** | **Telemetry** | Click "Simulate Heavy Spike" in terminal drawer. | CPU and RAM jump to >90%, dynamic Alert Banner fires, and canvas curves update in real-time. | **PASS** |
| **TC-09** | **Persistence**| Refresh browser or close tab after deploying containers and changing nodes. | Full system state reliably restored from `localStorage` without data loss. | **PASS** |

---

## 📁 File Structure

```text
SE LAB Project/
├── index.html        # Clean, semantic single-page application structure
├── styles.css        # Responsive dark-mode styling, variables, animations, and card layouts
├── app.js            # Vanilla JS state engine, telemetry charts, RBAC rules, & modals
└── README.md         # Complete system documentation, UML/ER/DFD diagrams, and test suite
```

---

## 🛡️ Security & Architecture Notes
- **Zero Ingestion of Untrusted Scripts:** No external CDNs or unverified third-party libraries are loaded.
- **Client-Side Data Isolation:** Application state is sandboxed inside `localStorage` under key `HOMELAB_OS_STATE_V1.4` and can be reset anytime using the **Reset Demo State** button in the sidebar.
- **Pure Canvas Drawing:** The telemetry graph leverages direct HTML5 2D Canvas rendering with device pixel ratio scaling, eliminating heavy charting framework overhead.
