# Task Tracking - Quick Start Guide

**For Agents: Get started in 2 minutes! ⚡**

---

## 🎯 Core Commands

```javascript
// 1. See all tasks
TaskList()

// 2. Claim a task
TaskUpdate({ taskId: "X", status: "in_progress", owner: "your-name" })

// 3. Complete a task
TaskUpdate({ taskId: "X", status: "completed" })

// 4. Create a new task
TaskCreate({
  subject: "Your task title",
  description: "What needs to be done",
  activeForm: "Doing the thing"
})
```

---

## 🔄 Simple Workflow

### **Morning:**
1. Check `TaskList()` for available work
2. Pick task with lowest ID that's `pending` and has no `blockedBy`
3. Claim it: `TaskUpdate({ taskId: "X", status: "in_progress", owner: "agent-1" })`

### **During Work:**
4. Do the work described in task
5. If you find blockers → update task description with blocker info
6. If you find new work → create new tasks

### **When Done:**
7. Mark complete: `TaskUpdate({ taskId: "X", status: "completed" })`
8. Update Daily Standup file

---

## ✅ Task Status Rules

**ONLY mark "completed" when:**
- ✅ Code is written AND working
- ✅ Tests pass
- ✅ No errors in console
- ✅ Documentation updated
- ✅ **Fully done!**

**Keep "in_progress" if:**
- ⏳ Still coding
- ⏳ Tests failing
- ⏳ Blocked by something
- ⏳ Waiting for review

---

## 🚫 Common Mistakes

❌ **Don't:**
- Mark incomplete work as done
- Work on tasks you didn't claim
- Forget to update Daily Standup
- Leave tasks in `in_progress` overnight without update

✅ **Do:**
- Update status frequently
- Report blockers early
- Create follow-up tasks
- Work in ID order when possible

---

## 📊 Quick Status Check

```javascript
// See your tasks
TaskList() // Look for your name in "owner"

// See what's blocked
TaskList() // Look for "blockedBy" field

// See what's available
TaskList() // Look for "pending" + no owner + no blockedBy
```

---

## 🆘 Need Help?

1. Update task with question
2. Tag Master in Daily Standup
3. Don't wait - ask within 4h!

---

**Full Guide:** See `TASK-TRACKING-WORKFLOW.md`

**Ready? Run:** `TaskList()` 🚀
