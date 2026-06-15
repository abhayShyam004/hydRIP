import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'

const ToastContext = createContext(null)

export function Avatar({ user, size = 32, outlined = false, onClick }) {
  const Component = onClick ? 'button' : 'div'
  const props = onClick ? { type: 'button', onClick, className: 'icon-button', 'aria-label': user.name } : {}
  
  return (
    <Component
      {...props}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: user.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Cormorant Garamond", serif',
        fontWeight: 600,
        fontSize: size * 0.45,
        color: 'var(--surface)',
        flexShrink: 0,
        outline: outlined ? '2px solid var(--veg)' : 'none',
        outlineOffset: outlined ? 3 : 0,
        border: 'none',
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {user.image ? (
        <img src={user.image} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        user.name[0]
      )}
    </Component>
  )
}

export function SectionLabel({ text, style = {} }) {
  return (
    <div
      style={{
        marginBottom: 12,
        color: 'var(--ink-3)',
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {text}
    </div>
  )
}

export function PillTab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? '0.5px solid var(--ink)' : '0.5px solid var(--line)',
        background: active ? 'var(--ink)' : 'var(--surface)',
        color: active ? 'var(--surface)' : 'var(--ink-2)',
        borderRadius: 999,
        padding: '7px 18px',
        fontSize: 14,
        fontWeight: 500,
        transition: 'background 260ms cubic-bezier(0.16, 1, 0.3, 1), color 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

export function PillTag({ label, color = 'var(--rust)' }) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 400,
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
      }}
    >
      {label}
    </span>
  )
}

export function GhostButton({ label, onClick, color = 'var(--rust)', type = 'button', style = {}, disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        padding: 0,
        color,
        fontSize: 13,
        fontWeight: 500,
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {label}
    </button>
  )
}

export function PrimaryButton({ label, onClick, disabled = false, type = 'button', style = {} }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        height: 52,
        background: 'var(--rust)',
        color: 'var(--surface)',
        border: 'none',
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 500,
        opacity: disabled ? 0.45 : 1,
        transition: 'opacity 260ms cubic-bezier(0.16, 1, 0.3, 1), background 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
    >
      {label}
    </button>
  )
}

export function InlineEdit({ value, onSave, inputType = 'text', style = {}, placeholder = '' }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isEditing) setDraft(value ?? '')
  }, [value, isEditing])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (inputType === 'textarea') autoResize(inputRef.current)
    }
  }, [isEditing, inputType])

  const autoResize = (el) => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handleSave = async () => {
    if (String(draft) !== String(value ?? '')) await onSave(draft)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft(value ?? '')
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputType !== 'textarea') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const inputStyle = {
    ...style,
    border: 'none',
    borderBottom: '1.5px solid var(--rust)',
    borderRadius: 0,
    background: 'transparent',
    outline: 'none',
    padding: '0 0 2px 0',
    width: '100%',
    resize: 'none',
    color: 'inherit',
  }

  if (!isEditing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
        <span style={style}>{value || placeholder}</span>
        <Pencil
          size={14}
          color="var(--ink-3)"
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setIsEditing(true)}
          aria-label="Edit"
        />
      </span>
    )
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 6, width: '100%' }}>
      {inputType === 'textarea' ? (
        <textarea
          ref={inputRef}
          value={draft}
          style={inputStyle}
          rows={1}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value)
            autoResize(e.target)
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <input
          ref={inputRef}
          type={inputType}
          value={draft}
          style={inputStyle}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      )}
      <Check size={14} color="var(--rust)" style={{ cursor: 'pointer', flexShrink: 0 }} onMouseDown={(e) => e.preventDefault()} onClick={handleSave} />
      <X size={14} color="var(--ink-3)" style={{ cursor: 'pointer', flexShrink: 0 }} onMouseDown={(e) => e.preventDefault()} onClick={handleCancel} />
    </span>
  )
}

export function BottomSheet({ open, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(26,20,16,0.40)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid var(--line-strong)',
          maxHeight: '90vh',
          overflowY: 'auto',
          transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--line-strong)',
            borderRadius: 999,
            margin: '12px auto 0',
          }}
        />
        {children}
      </div>
    </div>
  )
}

export function ConfirmSheet({ open, onClose, onConfirm, title, body, confirmLabel }) {
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    setSaving(true)
    await onConfirm()
    setSaving(false)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ padding: 24, display: 'grid', gap: 16 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          {body}
        </p>
        <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
          <PrimaryButton label={confirmLabel} onClick={handleConfirm} disabled={saving} />
          <GhostButton label="Cancel" onClick={onClose} color="var(--ink-3)" style={{ justifySelf: 'center', padding: 8 }} />
        </div>
      </div>
    </BottomSheet>
  )
}

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const timerRef = useRef(null)

  const showToast = (nextMessage) => {
    setMessage(nextMessage)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setMessage(''), 2500)
  }

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={message} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

function Toast({ message }) {
  if (!message) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 76,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--ink)',
        color: 'var(--surface)',
        borderRadius: 8,
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 400,
        zIndex: 200,
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      {message}
    </div>
  )
}
