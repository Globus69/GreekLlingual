# Task Tracking Workflow - HellenicHorizons GreekLingua

**Created:** 17. Februar 2026, 15:00 CET
**Purpose:** Workflow guide for using Claude Code Task Tools
**Optimization:** #3 (Task Tracking System)

---

## 🎯 Overview

This project uses **Claude Code's built-in Task Tools** for task management:
- `TaskCreate` - Create new tasks
- `TaskUpdate` - Update task status, assign owners, add dependencies
- `TaskGet` - Get full task details
- `TaskList` - See all tasks overview

**Benefits:**
- ✅ Single Source of Truth for all TODOs
- ✅ Real-time status visibility
- ✅ Automatic progress tracking
- ✅ Blocker management
- ✅ Dependency tracking
- ✅ No external tools needed

---

## 📊 Task Status Workflow

Tasks progress through these states:

```
pending → in_progress → completed
              ↓
           deleted (if no longer relevant)
```

### Status Definitions:

- **pending:** Task is ready to be worked on (no blockers)
- **in_progress:** Someone is actively working on this
- **completed:** Task is fully done and verified
- **deleted:** Task is no longer relevant

---

## 👥 Roles & Responsibilities

### **Master (Project Lead):**
- Creates tasks from TODOs
- Reviews task list daily
- Assigns priorities
- Resolves blockers within 4h
- Updates DAILY-STANDUP files

### **Agents (Developers):**
- Check TaskList for available work
- Claim tasks by setting `owner`
- Update status when starting (`in_progress`)
- Mark as `completed` when done
- Create follow-up tasks if needed
- Report blockers immediately

---

## 🔄 Daily Workflow

### **Morning (Master):**

1. **Review Daily Standup:**
   ```bash
   cat DAILY-STANDUP-YYYY-MM-DD.md
   ```

2. **Check Task List:**
   ```
   Use TaskList tool → See all tasks
   ```

3. **Identify Blockers:**
   - Look for tasks with `blockedBy`
   - Check agent reports
   - Plan resolution

4. **Prioritize:**
   - Assign high-priority tasks
   - Notify agents

### **During Work (Agents):**

1. **Find Available Task:**
   ```
   TaskList → Filter by:
   - status: 'pending'
   - no owner
   - no blockedBy
   ```

2. **Claim Task:**
   ```
   TaskUpdate taskId: "X"
   status: "in_progress"
   owner: "agent-1" (or your name)
   ```

3. **Work on Task:**
   - Follow task description
   - Document progress
   - Create sub-tasks if needed

4. **Complete Task:**
   ```
   TaskUpdate taskId: "X"
   status: "completed"
   ```

5. **Report in Standup:**
   - Update DAILY-STANDUP file
   - Note what was completed
   - Report any blockers

### **Evening (Agents):**

1. **Update Standup File:**
   ```markdown
   ## Agent X:
   - ✅ Today: [Task #X completed]
   - 🔄 In Progress: [Task #Y at 60%]
   - 🚧 Blocker: [Issue description]
   - ⏱️ Status: 75% complete
   ```

2. **Create Follow-up Tasks:**
   - If discovered new work during task
   - Use TaskCreate

---

## 📝 Task Creation Guidelines

### **When to Create a Task:**

✅ **DO create tasks for:**
- Features to implement
- Bugs to fix
- Testing work
- Documentation updates
- Refactoring work
- Research/investigation needed
- Any work that takes >30 minutes

❌ **DON'T create tasks for:**
- Trivial fixes (<5 min)
- Conversational questions
- One-line changes

### **Good Task Format:**

```javascript
TaskCreate({
  subject: "Implement User Authentication System",
  description: `
    Create user authentication with JWT tokens.

    **Requirements:**
    - Login endpoint (/api/auth/login)
    - Logout endpoint (/api/auth/logout)
    - JWT token generation
    - Token validation middleware

    **Success Criteria:**
    - User can login with PIN
    - Token is stored securely
    - Protected routes require auth
    - Logout clears token

    **Time:** 2-3 hours
    **Priority:** HIGH
    **Reference:** SECURITY.md Section 3
  `,
  activeForm: "Implementing User Authentication"
})
```

### **Task Naming Conventions:**

- Use imperative form: "Implement X", "Fix Y", "Test Z"
- Be specific: "Fix login validation" not "Fix bugs"
- Include context: "Migrate localStorage to httpOnly cookies"
- Reference files if relevant: "Test Practice Modes (page.tsx)"

---

## 🔗 Dependencies & Blockers

### **Adding Dependencies:**

If Task B depends on Task A:

```javascript
TaskUpdate({
  taskId: "B",
  addBlockedBy: ["A"]  // Task B is blocked by Task A
})

// OR equivalently:
TaskUpdate({
  taskId: "A",
  addBlocks: ["B"]  // Task A blocks Task B
})
```

### **Resolving Blockers:**

When Task A is completed:
1. Mark Task A as `completed`
2. System automatically unblocks Task B
3. Task B becomes available

### **Reporting Blockers:**

If you hit a blocker:
1. Update task with blocker info in description
2. Report in Daily Standup
3. Tag Master for help
4. Create dependency if another task must finish first

**Example:**
```javascript
TaskUpdate({
  taskId: "X",
  description: "Original description + BLOCKER: Need API endpoint from Task Y"
})
```

---

## 📊 Task List Management

### **Viewing Tasks:**

```javascript
// See all tasks
TaskList()

// Get specific task details
TaskGet({ taskId: "5" })
```

### **Task List Output:**

```
Tasks:
#1 [completed] Implement Linter-Config Fix (Owner: master)
#2 [in_progress] Implement Task Tracking System (Owner: master)
#3 [pending] Implement Design Tokens System
#4 [pending] Documentation Consolidation
#5 [in_progress] Performance Monitoring Setup (Owner: agent-1, BlockedBy: [#3])
#6 [pending] Practice Modes User Flow Testing
```

### **Prefer Working in ID Order:**

When multiple tasks are available, prefer lower ID numbers first:
- Earlier tasks often set up context for later ones
- Maintains logical flow
- Reduces dependencies

---

## 🔄 Weekly Cleanup

**Every Monday (Master):**

1. **Review Completed Tasks:**
   - Archive documentation
   - Update project status

2. **Check Stale Tasks:**
   - Tasks in `in_progress` for >3 days
   - Contact owner or re-assign

3. **Refine Pending Tasks:**
   - Update priorities
   - Add new information
   - Split large tasks if needed

---

## 📈 Progress Tracking

### **Automatic Metrics:**

The task system automatically tracks:
- Total tasks: `TaskList().length`
- Completed: Filter by `status: 'completed'`
- In Progress: Filter by `status: 'in_progress'`
- Pending: Filter by `status: 'pending'`

### **Reporting Progress:**

**Weekly Summary Template:**
```markdown
## Week XX Progress

**Tasks Completed:** 15/20 (75%)
**Tasks In Progress:** 3
**Tasks Pending:** 2
**Blockers:** 1 (Task #X waiting on API endpoint)

**Key Achievements:**
- ✅ Practice Modes testing complete
- ✅ Security audit passed
- ✅ Design tokens implemented

**Next Week Focus:**
- Performance monitoring setup
- Documentation consolidation
```

---

## 🎯 Best Practices

### **DO:**

✅ **Update tasks frequently** (at least daily)
✅ **Be specific** in task descriptions
✅ **Report blockers early** (<4h)
✅ **Mark completed** only when fully done
✅ **Create follow-up tasks** for discovered work
✅ **Use dependencies** to show relationships
✅ **Claim tasks** before starting work
✅ **Check TaskList** before starting new work

### **DON'T:**

❌ **Don't mark incomplete work** as completed
❌ **Don't leave tasks in** `in_progress` for days
❌ **Don't create duplicate tasks** (check TaskList first)
❌ **Don't forget to update** Daily Standup
❌ **Don't work on blocked tasks** without resolving blocker
❌ **Don't skip task updates** (others depend on status)

---

## 🔧 Integration with Existing Tools

### **Daily Standup Files:**

Task system **complements** Daily Standups:
- Tasks = What needs to be done (tactical)
- Standups = How work is progressing (strategic)

**Update both:**
1. TaskUpdate for status changes
2. Daily Standup for narrative context

### **Git Commits:**

Reference task IDs in commits:
```bash
git commit -m "feat(auth): Implement JWT authentication

Implements Task #9: Migrate localStorage to httpOnly cookies

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### **Documentation:**

Link tasks in documentation:
```markdown
## Authentication System

Status: ✅ Complete (Task #9)
...
```

---

## 📞 Getting Help

### **If you're stuck:**

1. **Check task description** - Are requirements clear?
2. **Check dependencies** - Are all blockers resolved?
3. **Ask in Daily Standup** - Tag Master for help
4. **Update task** - Add blocker description
5. **Don't wait** - Report early (<4h)

### **If requirements unclear:**

1. **Update task** - Ask questions in description
2. **Tag Master** - Request clarification
3. **Mark as blocker** - Don't proceed without clarity

---

## 📊 Success Metrics

**We'll know Task Tracking is successful when:**

- ✅ 0 lost tasks (everything tracked)
- ✅ <4h blocker resolution time
- ✅ 0 duplicate work
- ✅ Real-time status visibility
- ✅ Clear ownership of all work
- ✅ Automated progress reporting
- ✅ Team can work independently

**Target: 30% productivity increase** 🎯

---

## 🔄 This Document

**Updates:**
- 17.02.2026: Initial version created
- Keep updated as workflow evolves

**Feedback:**
- Report workflow issues to Master
- Suggest improvements in Daily Standup

---

**End of Task Tracking Workflow** ✅

**Quick Reference:**
- Create: `TaskCreate({ subject, description, activeForm })`
- Update: `TaskUpdate({ taskId, status, owner })`
- View: `TaskList()`
- Details: `TaskGet({ taskId })`

Ready to track! 🚀
