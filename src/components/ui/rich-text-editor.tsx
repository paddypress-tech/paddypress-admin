"use client"

import * as React from "react"
import type { Editor } from "@tiptap/core"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo,
  Undo,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function RichTextEditor(props: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: props.placeholder ?? "",
      }),
    ],
    content: props.value || "",
    editable: !props.disabled,
    onUpdate: ({ editor }: { editor: Editor }) => {
      props.onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        "data-slot": "input-group-control",
        class: cn(
          "max-w-none min-h-24 w-full rounded-none bg-transparent px-2 py-2 text-xs/relaxed outline-none",
          props.className
        ),
      },
    },
  })

  React.useEffect(() => {
    if (!editor) return
    const incoming = props.value || ""
    const current = editor.getHTML()
    if (incoming !== current) {
      editor.commands.setContent(incoming, false)
    }
  }, [editor, props.value])

  function setLink() {
    if (!editor) return
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Enter link URL", previous ?? "")
    if (url === null) return
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }

  return (
    <div className="w-full">
      <div className="border-border/50 flex flex-wrap items-center gap-1 border-b px-2 py-1">
        <Button
          type="button"
          size="icon-xs"
          variant={editor?.isActive("bold") ? "secondary" : "ghost"}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor || props.disabled}
          aria-label="Bold"
        >
          <Bold className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant={editor?.isActive("italic") ? "secondary" : "ghost"}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor || props.disabled}
          aria-label="Italic"
        >
          <Italic className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant={editor?.isActive("bulletList") ? "secondary" : "ghost"}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor || props.disabled}
          aria-label="Bullet list"
        >
          <List className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant={editor?.isActive("orderedList") ? "secondary" : "ghost"}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={!editor || props.disabled}
          aria-label="Ordered list"
        >
          <ListOrdered className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant={editor?.isActive("link") ? "secondary" : "ghost"}
          onClick={setLink}
          disabled={!editor || props.disabled}
          aria-label="Link"
        >
          <LinkIcon className="size-3" />
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor || props.disabled || !editor.can().undo()}
          aria-label="Undo"
        >
          <Undo className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor || props.disabled || !editor.can().redo()}
          aria-label="Redo"
        >
          <Redo className="size-3" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
