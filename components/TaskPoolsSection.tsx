"use client";

import { GameState } from "@/types/game";
import { Button } from "./ui";

interface TaskPoolsSectionProps {
  game: GameState;
  isDark: boolean;
  onClearPools: () => void;
  onEditTask?: (taskId: string) => void;
}

export default function TaskPoolsSection({ game, isDark, onClearPools, onEditTask }: TaskPoolsSectionProps) {
  const usedPoolTaskIds = new Set(game.usedPoolTaskIds || []);

  return (
    <div className="space-y-4">
      <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
        Task Pools
      </h2>
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
        Tasks imported here can be assigned to race tiles. USED tasks are currently on the board.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((difficulty) => {
          const tasks = game.taskPools?.[difficulty] || [];
          const unusedCount = tasks.filter((t) => !t.used).length;

          return (
            <div
              key={difficulty}
              className={`
                rounded-2xl border p-4 shadow-sm
                ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Difficulty {difficulty}
                </h3>
                <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {unusedCount}/{tasks.length} unused
                </div>
              </div>

              <div
                className={`
                  max-h-[300px] overflow-auto rounded-xl border p-3
                  ${isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}
                `}
              >
                {tasks.length === 0 ? (
                  <div className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    No tasks yet. Import tasks to add them to this pool.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {tasks.map((task) => {
                      const used = usedPoolTaskIds.has(task.id) || task.used;
                      return (
                        <li
                          key={task.id}
                          className={`
                            rounded-lg border p-2
                            ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}
                          `}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm break-words ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                                {task.label}
                              </div>
                              {task.image && (
                                <img
                                  src={task.image}
                                  alt={task.label}
                                  className="mt-2 h-12 w-auto rounded object-contain"
                                />
                              )}
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <Button
                                variant="secondary"
                                isDark={isDark}
                                className="text-[10px] px-2 py-0.5"
                                onClick={() => onEditTask && onEditTask(task.id)}
                              >
                                ✏️ Edit
                              </Button>
                              {used && (
                                <span
                                  className={`
                                    rounded-full px-2 py-0.5 text-[10px] font-semibold text-center
                                    ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"}
                                  `}
                                >
                                  USED
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
