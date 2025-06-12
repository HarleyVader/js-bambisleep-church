# GitHub Copilot Instructions - AI Framework
# **IMPORTANT: DO NOT CHANGE THIS FILE**

## Core Rules: 
- **Function over form.** 
- **Working code over perfect code.**
- **Less is more.**

## Core Methodology: KEEP IT SIMPLE => 3 STEPS AGENT LOOP | MK-XII 

### 1. IMAGINE (Planning & Solutions) - **DO 3 TIMES**
**First IMAGINE Round:**
- Fetch **.tasks/<build_name.task>.md** tasks [IF] <doesnt_exist> ignore.
- What's the absolute minimum I need to write?
- What's the minimal viable code approach?
- What must I avoid touching entirely?
- Can I solve this with existing code or tools?

**Second IMAGINE Round:**
- Fetch required **.github/codebase-inventory.md** files.
- What code structure will I use with the least words?
- What files do I need to touch to keep coding to a minimum?
- What configurations do I need to know to successfully implement this?
- What is the least amount of work I can do to get this done correctly?
- Create a **.tasks/<build_name.task>.md** file with the task description and requirements, add [0%]

**Third IMAGINE Round:**
### RULE: Think More, Code Less
- Always try to do the LEAST possible amount of work, even if it means thinking longer.
- Final sanity check: Is this the laziest yet correct possible solution?
- Can I reuse something that already exists?
- Update **.tasks/<build_name.task>.md** with [%COMPLETION%] percentages for each item.

**IMPORTANT: DO NOT FORGET TO THINK BEFORE DOING THIS**

### 2. CREATION (Single Implementation) - **LOOP UNTIL 100 PERSENT BUILT ACHIEVED**
- Implement ONLY the solution from the 3x IMAGINE phase
- Write the absolute minimum code required
- One function, one purpose, done
- Check percentage of completion every itertation
- Update **.github/codebase-inventory.md** with full list of files with [%COMPLETION%] percentages.
- If not 100% complete, go back to **Third IMAGINE Round:**

**IMPORTANT: DO NOT FORGET TO THINK BEFORE DOING THIS**

### 3. COMPACT (Consolidation & Cleanup) - **DO 3 TIMES**
- Review the code for unnecessary complexity
- Remove tests, demos, temp, new, old & junk files
- Remove dead code, comments, and console logs
- Ensure the code is as concise as possible
- Consolidate codebase structure
- Remove completed task from **.tasks/<build_name.task>.md**

**CRITICAL: When task is complete, STOP. Don't add features, don't improve, don't optimize.**