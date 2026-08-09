import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Card } from '../components/ui/card.jsx'
import Reveal from '../components/Reveal.jsx'
import { IconPlus, IconTrash, IconClose, IconClock, IconChecklist, IconAlert } from '../components/icons.jsx'
import { useChecklists, progressOf, urgentFeed, newItem, urgentOpen } from '../lib/checklists.js'
import { urgencyOf } from '../lib/urgency.js'
import { parseObjective, fmtRange12, to12h, timeState, nowMins } from '../lib/timephrase.js'

/* ---------- shared bits ---------- */

// Urgency is a property of the objective, not the checklist, and has two states.
// The word rides along with the hue so the level never depends on colour alone.
function UrgentMark({ on, withLabel = false }) {
  if (!on) return null
  const u = urgencyOf(true)
  return (
    <span className="ck-urgmark" style={{ color: u.color }} title="Urgent">
      <span className="ck-urgmark-bars" aria-hidden="true"><i /><i /><i /></span>
      {withLabel && <span>Urgent</span>}
      {!withLabel && <span className="sr-only">Urgent</span>}
    </span>
  )
}

// Bordered chip — modal editor only, where density is low.
function TimeChip({ item, state }) {
  if (item.start == null) return null
  return (
    <span className={'ck-time' + (state ? ' is-' + state : '')}>
      {state === 'now' && <i className="ck-time-live" aria-hidden="true" />}
      {fmtRange12(item.start, item.end)}
    </span>
  )
}

// Flat tinted type — the board. A filled chip per objective was the main noise source.
function TimeText({ item, state }) {
  if (item.start == null) return null
  return (
    <span className={'ck-t' + (state ? ' is-' + state : '')}>
      {state === 'now' && <i className="ck-t-live" aria-hidden="true" />}
      {to12h(item.start)}
    </span>
  )
}

function Tick({ done, onClick, label }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={done} aria-label={label}
      className={'ck-tick' + (done ? ' is-done' : '')}>
      {done && <svg viewBox="0 0 24 24" width="11" height="11"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  )
}

/* ---------- right rail: urgent & upcoming ---------- */
function UrgentCard({ lists, onOpen }) {
  const [, tick] = useState(0)
  // Re-render each minute so "now" / "late" stay truthful without a reload.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  const feed = useMemo(() => urgentFeed(lists).slice(0, 6), [lists])
  const now = nowMins()

  return (
    <Card variant="soft" className="cg-w ck-urgent">
      <div className="ck-urgent-head">
        <span className="ck-urgent-ico"><IconAlert /></span>
        <div>
          <div className="ck-eye">Urgent &amp; upcoming</div>
          <div className="ck-urgent-sub">{feed.length ? `${feed.length} objective${feed.length === 1 ? '' : 's'} need you` : 'Nothing pending'}</div>
        </div>
      </div>

      <div className="ck-urgent-list">
        {feed.length === 0 && (
          <div className="ck-empty-sm">All clear. Add a checklist to see what&rsquo;s next here.</div>
        )}
        {/* time first, then the objective */}
        {feed.map((r) => {
          const state = timeState(r.item, now)
          return (
            <button type="button" key={r.item.id} className="ck-urow" onClick={() => onOpen(r.listId)}
              title={`${r.item.text} — ${r.listTitle}${r.item.urgent ? ' · urgent' : ''}`}
              aria-label={`${r.item.text}, ${r.listTitle}${r.item.urgent ? ', urgent' : ''}`}>
              <span className="ck-urow-mark">{r.item.urgent ? <UrgentMark on /> : <span className="ck-urow-pip" aria-hidden="true" />}</span>
              <span className="ck-urow-time"><TimeText item={r.item} state={state} /></span>
              <span className="ck-urow-t">{r.item.text}</span>
              {state === 'past' && <span className="ck-flag is-late">late</span>}
              {state === 'now' && <span className="ck-flag is-now">now</span>}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/* ---------- a checklist, as a card: name + progress, nothing else ---------- */
function ListBox({ list, onOpen }) {
  const p = progressOf(list)
  return (
    <button type="button" className="ck-box-btn" onClick={() => onOpen(list.id)} aria-label={`Open ${list.title}`}>
      <Card variant="soft" className="cg-w ck-box">
        <h3 className="ck-box-title"><span>{list.title}</span></h3>
        <div className="ck-box-foot">
          <div className="ck-bar" role="progressbar" aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100}
            aria-label={`${list.title} progress`}>
            <i style={{ width: p.pct + '%', background: p.complete ? '#2FB893' : '#e6e6e6' }} />
          </div>
          <span className="ck-box-count">{p.done}/{p.total}</span>
          <span className="ck-box-pct">{p.pct}%</span>
        </div>
      </Card>
    </button>
  )
}

/* ---------- the add tile, sized exactly like a card ---------- */
function AddTile({ onClick }) {
  return (
    <button type="button" className="ck-add" onClick={onClick} aria-label="New checklist">
      <span className="ck-add-plus"><IconPlus /></span>
      <span className="ck-add-t">New checklist</span>
    </button>
  )
}

/* ---------- modal: compose + edit ---------- */
function ObjectiveInput({ onAdd }) {
  const [text, setText] = useState('')
  const [urgent, setUrgent] = useState(false)
  const preview = useMemo(() => (text.trim() ? parseObjective(text) : null), [text])
  const submit = () => {
    if (!text.trim()) return
    onAdd(text, urgent)
    setText('')
    setUrgent(false)
  }
  return (
    <div className="ck-objin">
      <div className="ck-objin-row">
        <input
          className="ck-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          placeholder="09:00am - 10:00am Revise graphs"
          aria-label="New objective"
        />
        <button type="button" className="ck-addbtn" onClick={submit} disabled={!text.trim()} aria-label="Add objective">
          <IconPlus />
        </button>
      </div>

      <div className="ck-objin-meta">
        <label className="ck-check">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          <span className="ck-check-box" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span className="ck-check-l">Urgent</span>
        </label>
        {preview && (
          <span className="ck-preview">
            {preview.start != null ? (
              <>
                <span className="ck-preview-k"><IconClock /> timed</span>
                <span className="ck-time">{fmtRange12(preview.start, preview.end)}</span>
              </>
            ) : <span className="ck-preview-k">text</span>}
            <span className="ck-preview-t">{preview.text}</span>
          </span>
        )}
      </div>
    </div>
  )
}

function Modal({ mode, list, api, onClose }) {
  const rm = useReducedMotion()
  const [draftTitle, setDraftTitle] = useState('')
  const [draftItems, setDraftItems] = useState([])
  const [confirmDel, setConfirmDel] = useState(false)
  const titleRef = useRef(null)
  const creating = mode === 'new'

  useEffect(() => {
    if (creating) { setDraftTitle(''); setDraftItems([]) }
    setConfirmDel(false)
    const t = setTimeout(() => { if (titleRef.current) titleRef.current.focus() }, 240)
    return () => clearTimeout(t)
  }, [mode, list && list.id]) // eslint-disable-line

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const title = creating ? draftTitle : (list ? list.title : '')
  const items = creating ? draftItems : (list ? list.items : [])
  const p = { done: items.filter((i) => i.done).length, total: items.length }
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0

  const setTitle = (v) => (creating ? setDraftTitle(v) : api.updateList(list.id, { title: v }))
  const addObjective = (line, urgent) => {
    if (creating) { const it = newItem(line, urgent); if (it) setDraftItems((xs) => [it, ...xs]) }
    else api.addItem(list.id, line, urgent)
  }
  const toggle = (id) => {
    if (creating) setDraftItems((xs) => xs.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
    else api.toggleItem(list.id, id)
  }
  const toggleUrgent = (id) => {
    if (creating) setDraftItems((xs) => xs.map((i) => (i.id === id ? { ...i, urgent: !i.urgent } : i)))
    else api.updateItem(list.id, id, { urgent: !items.find((i) => i.id === id).urgent })
  }
  const drop = (id) => {
    if (creating) setDraftItems((xs) => xs.filter((i) => i.id !== id))
    else api.removeItem(list.id, id)
  }

  const create = () => {
    const t = draftTitle.trim()
    if (!t) return
    api.addList({ title: t, items: draftItems, created: new Date().toISOString() })
    onClose()
  }

  const pop = rm
    ? { initial: false, animate: {}, exit: {} }
    : {
      initial: { opacity: 0, scale: 0.955, y: 10 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.975, y: 6, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } },
      transition: { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 },
    }

  // Portalled to <body>: AppLayout wraps the page in `relative z-10`, which traps
  // any descendant beneath the fixed navbar (z-60) no matter how high its z-index.
  return createPortal(
    <>
      <motion.div className="ck-scrim" onMouseDown={onClose}
        initial={rm ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }} />
      <div className="ck-modal-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <motion.div className="ck-modal" role="dialog" aria-modal="true"
          aria-label={creating ? 'New checklist' : `Edit ${title}`} {...pop}>
          <div className="ck-modal-head">
            <div className="ck-eye">{creating ? 'New checklist' : 'Checklist'}</div>
            <button type="button" className="ck-x" onClick={onClose} aria-label="Close"><IconClose /></button>
          </div>

          <div className="ck-modal-body">
            <label className="ck-field">
              <span className="ck-label">Title</span>
              <input ref={titleRef} className="ck-input ck-input--title" value={title}
                onChange={(e) => setTitle(e.target.value)} placeholder="Interview week sprint" aria-label="Checklist title" />
            </label>

            <div className="ck-field">
              <span className="ck-label">Add an objective</span>
              {/* compose field sits above the list, so new objectives land under the cursor */}
              <ObjectiveInput onAdd={addObjective} />
            </div>

            <div className="ck-field">
              {p.total > 0 && (
                <div className="ck-bar ck-bar--wide" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Checklist progress">
                  <i style={{ width: pct + '%', background: pct === 100 ? '#2FB893' : '#e6e6e6' }} />
                </div>
              )}
              <div className="ck-objs">
                {items.length === 0 && <div className="ck-empty-sm">Nothing yet. Add your first objective above.</div>}
                {items.map((i) => (
                  <div className={'ck-obj' + (i.done ? ' is-done' : '')} key={i.id}>
                    <Tick done={i.done} onClick={() => toggle(i.id)} label={`Complete ${i.text}`} />
                    {/* time first, then the objective */}
                    <TimeChip item={i} state={timeState(i)} />
                    <span className="ck-obj-t">{i.text}</span>
                    <button type="button" className={'ck-obj-u' + (i.urgent ? ' is-on' : '')}
                      onClick={() => toggleUrgent(i.id)} aria-pressed={!!i.urgent}
                      aria-label={i.urgent ? `Mark ${i.text} normal` : `Mark ${i.text} urgent`}
                      title={i.urgent ? 'Urgent — click for normal' : 'Mark urgent'}>
                      <span className="ck-urgmark-bars" aria-hidden="true"><i /><i /><i /></span>
                    </button>
                    <button type="button" className="ck-obj-x" onClick={() => drop(i.id)} aria-label={`Delete ${i.text}`}>
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ck-modal-foot">
            {creating ? (
              <>
                <button type="button" className="ck-btn ck-btn--ghost" onClick={onClose}>Cancel</button>
                <button type="button" className="ck-btn ck-btn--primary" onClick={create} disabled={!draftTitle.trim()}>
                  Create checklist
                </button>
              </>
            ) : confirmDel ? (
              <>
                <span className="ck-confirm">Delete this checklist?</span>
                <button type="button" className="ck-btn ck-btn--ghost" onClick={() => setConfirmDel(false)}>Keep</button>
                <button type="button" className="ck-btn ck-btn--danger" onClick={() => { api.removeList(list.id); onClose() }}>Delete</button>
              </>
            ) : (
              <>
                <button type="button" className="ck-btn ck-btn--ghost ck-btn--del" onClick={() => setConfirmDel(true)}>
                  <IconTrash /> Delete
                </button>
                <button type="button" className="ck-btn ck-btn--primary" onClick={onClose}>Done</button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  )
}

/* ---------- page ---------- */
export default function Checklist() {
  const api = useChecklists()
  const { lists } = api
  const [open, setOpen] = useState(null) // null | 'new' | listId

  const current = open && open !== 'new' ? lists.find((l) => l.id === open) : null
  // A list deleted from another tab shouldn't leave an orphaned modal open.
  useEffect(() => { if (open && open !== 'new' && !current) setOpen(null) }, [open, current])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const sorted = useMemo(() => {
    return [...lists].sort((a, b) => {
      const ap = progressOf(a).complete ? 1 : 0
      const bp = progressOf(b).complete ? 1 : 0
      if (ap !== bp) return ap - bp                        // finished sink
      const u = urgentOpen(b) - urgentOpen(a)              // most urgent work floats
      if (u) return u
      return String(b.created || '').localeCompare(String(a.created || ''))
    })
  }, [lists])

  return (
    <div className="home-page ck-page mx-auto w-full max-w-[1400px] px-4 sm:px-6">
      <Reveal>
        <div className="ck-head">
          <div>
            <div className="ck-eye">Board</div>
            <h1 className="cg-chrome ck-h1">Checklist</h1>
            <p className="ck-head-sub">
              A drawing board for what has to happen. Every objective carries its own
              priority; what&rsquo;s urgent stays pinned on the right.
            </p>
          </div>
          <button type="button" className="ck-newbtn" onClick={() => setOpen('new')}>
            <IconPlus /> New checklist
          </button>
        </div>
      </Reveal>

      <div className="ck-layout">
        <div className="ck-grid">
          <Reveal delay={0.04}><AddTile onClick={() => setOpen('new')} /></Reveal>
          {sorted.map((l, i) => (
            <Reveal key={l.id} delay={0.07 + Math.min(i, 6) * 0.04}>
              <ListBox list={l} onOpen={setOpen} />
            </Reveal>
          ))}
        </div>
        {/* second in the DOM so it sits right on desktop; CSS lifts it above the
            board on mobile, where what's urgent should be read first */}
        <Reveal delay={0} className="ck-rail"><UrgentCard lists={lists} onOpen={setOpen} /></Reveal>
      </div>

      {lists.length === 0 && (
        <div className="ck-zero">
          <span className="ck-zero-ico"><IconChecklist /></span>
          <div className="ck-zero-t">No checklists yet</div>
          <div className="ck-zero-s">Hit the big plus to lay down your first one.</div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <Modal key={open} mode={open === 'new' ? 'new' : 'edit'} list={current} api={api}
            onClose={() => setOpen(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
