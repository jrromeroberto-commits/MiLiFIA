-- CreateIndex
CREATE INDEX "Expense_userId_createdAt_idx" ON "Expense"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Goal_userId_createdAt_idx" ON "Goal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Goal_userId_completedAt_idx" ON "Goal"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "Habit_userId_createdAt_idx" ON "Habit"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "HabitLog_userId_createdAt_idx" ON "HabitLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Idea_userId_createdAt_idx" ON "Idea"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Note_userId_createdAt_idx" ON "Note"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Project_userId_createdAt_idx" ON "Project"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_userId_createdAt_idx" ON "Task"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_userId_completedAt_idx" ON "Task"("userId", "completedAt");
