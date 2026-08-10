import { useState } from 'react'
import { FocusProgressGraph } from '@/components/FocusProgressGraph'
import { TodayTodos } from '@/components/TodayTodos'
import { TodoDialog } from '@/components/TodoDialog'

export function FocusView() {
  const [dialog, setDialog] = useState<{ open: boolean; todoId?: string }>({ open: false })

  return (
    <main className="mx-auto max-w-3xl space-y-4 pb-20 pt-2">
      <FocusProgressGraph />
      <TodayTodos
        onNew={() => setDialog({ open: true })}
        onEdit={(todoId) => setDialog({ open: true, todoId })}
      />
      <TodoDialog
        open={dialog.open}
        todoId={dialog.todoId}
        onClose={() => setDialog({ open: false })}
      />
    </main>
  )
}
