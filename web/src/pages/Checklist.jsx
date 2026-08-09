import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Card } from '../components/ui/card.jsx'
import Reveal from '../components/Reveal.jsx'
import { IconPlus, IconTrash, IconClose, IconClock, IconChecklist, IconAlert } from '../components/icons.jsx'
import { useChecklists, progressOf, urgentFeed, newItem } from '../lib/checklists.js'
import { URGENCY, URGENCY_ORDER, urgencyOf } from '../lib/urgency.js'
import { parseObjective, fmtRange, toHHMM, timeState, nowMins } from '../lib/timephrase.js'

/* ---------- shared bits ---------- */

// Urgency is carried by bar count + wording as well as hue, so it survives
// greyscale and colour-blind viewing (WCAG 1.4.1).
function UrgencyMark({ level, showLabel = true, size = 'md' }) {
  const u = urgencyOf(level)
  return (
    <span className={'ck-urg ck-urg--' + size} style={{ color: u.color }}>
      <span className="ck-urg-bars" aria-hidden="true">
        {[0, 1, 2].map((i) => <i key={i} style={{ background: i < u.bars ? u.color : 'currentColor', opacity: i < u.bars ? 1 : 0.22 }} />)}
      </span>
      {showLabel && <span className="ck-urg-l">{u.label}</span>}
    </span>
  )
}

// Bordered chip — used only inside the modal editor, where density is low.
function TimeChip({ item, state }) {
  if (item.start == null) return null
  return (
    <span className={'ck-time' + (state ? ' is-' + state : '')}>
      {state === 'now' && <i className="ck-time-live" aria-hidden="true" />}
      {fmtRange(item.start, item.end)}
    </span>
  )
}

// Flat text — used on the board. A filled chip per objective was the main source of
// visual noise once several boxes sat side by side, so out here the time is just
// tinted type and only "now" earns a mark.
function TimeText({ item, state, showEnd = false }) {
  if (item.start == null) return null
  return (
    <span className={'ck-t' + (state ? ' is-' + state : '')}>
      {state === 'now' && <i className="ck-t-live" aria-hidden="true" />}
      {showEnd ? fmtRange(item.start, item.end) : toHHMM(item.start)}
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

/* ---------- top-left rail: urgent & pending / upcoming ---------- */
function UrgentCard({ lists, onOpen }) {
  const [, tick] = useState(0)
  // Re-render each minute so "now" / "soon" stay truthful without a reload.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  const feed = useMemo(() => urgentFeed(lists).slice(0, 5), [lists])
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
        {/* One line per objective. The second line (source checklist) and the filled
            time chip made six of these read as a wall, so the source is folded inline
            and the time is plain type. */}
        {feed.map((r) => {
          const state = timeState(r.item, now)
          return (
            <button type="button" key={r.item.id} className="ck-urow" onClick={() => onOpen(r.listId)}
              title={`${r.item.text} — ${r.listTitle} · ${r.urgency.label} urgency`}
              aria-label={`${r.item.text}, ${r.listTitle}, ${r.urgency.label} urgency`}>
              <UrgencyMark level={r.urgency.key} showLabel={false} size="sm" />
              <span className="ck-urow-time"><TimeText item={r.item} state={state} /></span>
              {/* the source checklist lives in the tooltip/label rather than inline —
                  it truncated to "· Int…" on half the rows and read as noise */}
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

/* ---------- a checklist, as a large box ---------- */
function ListBox({ list, onOpen }) {
  const p = progressOf(list)
  const u = urgencyOf(list.urgency)
  // A box carries title, urgency and progress. It used to also list three objectives
  // with a filled time chip each, which is what made a row of boxes read as clutter —
  // now it shows only what is up next, in one quiet line.
  const next = list.items.find((i) => !i.done)
  const remaining = p.total - p.done
  return (
    <button type="button" className="ck-box-btn" onClick={() => onOpen(list.id)} aria-label={`Open ${list.title}`}>
      <Card variant="soft" className="cg-w ck-box" style={{ '--u': u.color }}>
        <span className="ck-box-edge" aria-hidden="true" style={{ background: u.color }} />
        <div className="ck-box-head">
          <h3 className="ck-box-title">{list.title}</h3>
          <UrgencyMark level={list.urgency} />
        </div>

        <div className="ck-box-next">
          {p.total === 0 ? <span className="ck-quiet">No objectives yet</span>
            : !next ? <span className="ck-done-note">Every objective cleared</span>
              : (
                <>
                  <span className="ck-box-next-k">Next</span>
                  <span className="ck-box-next-t">
                    <TimeText item={next} state={timeState(next)} />
                    <span className="ck-box-next-x">{next.text}</span>
                  </span>
                  {remaining > 1 && <span className="ck-quiet">+{remaining - 1} more</span>}
                </>
              )}
        </div>

        <div className="ck-box-foot">
          <div className="ck-bar" role="progressbar" aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100}
            aria-label={`${list.title} progress`}>
            <i style={{ width: p.pct + '%', background: p.complete ? '#2FB893' : u.color }} />
          </div>
          <span className="ck-box-count">{p.done}/{p.total}</span>
          <span className="ck-box-pct">{p.pct}%</span>
        </div>
      </Card>
    </button>
  )
}

/* ---------- the big add tile ---------- */
function AddTile({ onClick }) {
  return (
    <button type="button" className="ck-add" onClick={onClick} aria-label="New checklist">
      <span className="ck-add-plus"><IconPlus /></span>
      <span className="ck-add-t">New checklist</span>
      <span className="ck-add-s">Title it, then add objectives</span>
    </button>
  )
}

/* ---------- left drawer: compose + edit ---------- */
function ObjectiveInput({ onAdd }) {
  const [text, setText] = useState('')
  const preview = useMemo(() => (text.trim() ? parseObjective(text) : null), [text])
  const submit = () => {
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }
  return (
    <div className="ck-objin">
      <div className="ck-objin-row">
        <input
          className="ck-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          placeholder="Add an objective — or 09:00 - 10:30 Revise graphs"
          aria-label="New objective"
        />
        <button type="button" className="ck-addbtn" onClick={submit} disabled={!text.trim()} aria-label="Add objective">
          <IconPlus />
        </button>
      </div>
      {preview && (
        <div className="ck-preview">
          {preview.start != null ? (
            <>
              <span className="ck-preview-k"><IconClock /> timed</span>
              <span className="ck-time is-later">{fmtRange(preview.start, preview.end)}</span>
              <span className="ck-preview-t">{preview.text}</span>
            </>
          ) : (
            <>
              <span className="ck-preview-k">text</span>
              <span className="ck-preview-t">{preview.text}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Drawer({ mode, list, api, onClose }) {
  const rm = useReducedMotion()
  const [draftTitle, setDraftTitle] = useState('')
  const [draftUrg, setDraftUrg] = useState('normal')
  const [draftItems, setDraftItems] = useState([])
  const [confirmDel, setConfirmDel] = useState(false)
  const titleRef = useRef(null)
  const creating = mode === 'new'

  useEffect(() => {
    if (creating) { setDraftTitle(''); setDraftUrg('normal'); setDraftItems([]) }
    setConfirmDel(false)
    const t = setTimeout(() => { if (titleRef.current) titleRef.current.focus() }, 260)
    return () => clearTimeout(t)
  }, [mode, list && list.id]) // eslint-disable-line

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const title = creating ? draftTitle : (list ? list.title : '')
  const urgency = creating ? draftUrg : (list ? list.urgency : 'normal')
  const items = creating ? draftItems : (list ? list.items : [])
  const p = { done: items.filter((i) => i.done).length, total: items.length }
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0

  const setTitle = (v) => (creating ? setDraftTitle(v) : api.updateList(list.id, { title: v }))
  const setUrg = (v) => (creating ? setDraftUrg(v) : api.updateList(list.id, { urgency: v }))
  const addObjective = (line) => {
    if (creating) { const it = newItem(line); if (it) setDraftItems((xs) => [...xs, it]) }
    else api.addItem(list.id, line)
  }
  const toggle = (id) => {
    if (creating) setDraftItems((xs) => xs.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
    else api.toggleItem(list.id, id)
  }
  const drop = (id) => {
    if (creating) setDraftItems((xs) => xs.filter((i) => i.id !== id))
    else api.removeItem(list.id, id)
  }

  const create = () => {
    const t = draftTitle.trim()
    if (!t) return
    api.addList({ title: t, urgency: draftUrg, items: draftItems, created: new Date().toISOString() })
    onClose()
  }

  // Centred floating panel rather than a side drawer: editing a checklist is a focused
  // task, and the middle of the screen is where the eye already is after clicking a box.
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
            <span className="ck-label">Urgency</span>
            <div className="ck-seg" role="radiogroup" aria-label="Urgency">
              {URGENCY_ORDER.map((k) => {
                const u = URGENCY[k]
                const on = urgency === k
                return (
                  <button type="button" key={k} role="radio" aria-checked={on}
                    className={'ck-seg-b' + (on ? ' is-on' : '')} onClick={() => setUrg(k)}
                    style={on ? { color: u.color, background: u.dim, borderColor: u.edge } : undefined}>
                    <span className="ck-urg-bars" aria-hidden="true">
                      {[0, 1, 2].map((i) => <i key={i} style={{ background: i < u.bars ? (on ? u.color : '#8a8a8a') : 'currentColor', opacity: i < u.bars ? 1 : 0.2 }} />)}
                    </span>
                    {u.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="ck-field">
            <span className="ck-label">
              Objectives
              {p.total > 0 && <span className="ck-label-c">{p.done}/{p.total} · {pct}%</span>}
            </span>
            {p.total > 0 && (
              <div className="ck-bar ck-bar--wide" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Checklist progress">
                <i style={{ width: pct + '%', background: pct === 100 ? '#2FB893' : urgencyOf(urgency).color }} />
              </div>
            )}
            <div className="ck-objs">
              {items.length === 0 && <div className="ck-empty-sm">Nothing yet. Add your first objective below.</div>}
              {items.map((i) => {
                const st = timeState(i)
                return (
                  <div className={'ck-obj' + (i.done ? ' is-done' : '')} key={i.id}>
                    <Tick done={i.done} onClick={() => toggle(i.id)} label={`Complete ${i.text}`} />
                    <span className="ck-obj-t">{i.text}</span>
                    <TimeChip item={i} state={st} />
                    <button type="button" className="ck-obj-x" onClick={() => drop(i.id)} aria-label={`Delete ${i.text}`}>
                      <IconTrash />
                    </button>
                  </div>
                )
              })}
            </div>
            <ObjectiveInput onAdd={addObjective} />
            <p className="ck-hint">
              Start a line with a time and it becomes a scheduled objective —
              <code>09:00 - 10:30</code>, <code>14:00</code> or <code>9am - 10:30am</code> all work.
            </p>
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
          ) : (
            <>
              {confirmDel ? (
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
  // A list deleted from another tab shouldn't leave an orphaned drawer open.
  useEffect(() => { if (open && open !== 'new' && !current) setOpen(null) }, [open, current])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const sorted = useMemo(() => {
    return [...lists].sort((a, b) => {
      const ap = progressOf(a).complete ? 1 : 0
      const bp = progressOf(b).complete ? 1 : 0
      if (ap !== bp) return ap - bp                                  // finished sink
      const u = urgencyOf(b.urgency).rank - urgencyOf(a.urgency).rank // urgent float
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
              A drawing board for what has to happen. Urgent work surfaces top-left; everything else is a box.
            </p>
          </div>
          <button type="button" className="ck-newbtn" onClick={() => setOpen('new')}>
            <IconPlus /> New checklist
          </button>
        </div>
      </Reveal>

      {/* The urgent rail is its own column rather than a grid cell: it is legitimately
          taller than a checklist box, and as a cell it forced a ragged row and a
          large void beside it. */}
      <div className="ck-layout">
        <Reveal delay={0} className="ck-rail"><UrgentCard lists={lists} onOpen={setOpen} /></Reveal>
        <div className="ck-grid">
          <Reveal delay={0.05}><AddTile onClick={() => setOpen('new')} /></Reveal>
          {sorted.map((l, i) => (
            <Reveal key={l.id} delay={0.08 + Math.min(i, 6) * 0.04}>
              <ListBox list={l} onOpen={setOpen} />
            </Reveal>
          ))}
        </div>
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
          <Drawer key={open} mode={open === 'new' ? 'new' : 'edit'} list={current} api={api}
            onClose={() => setOpen(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
