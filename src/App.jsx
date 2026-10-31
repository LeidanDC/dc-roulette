import { useState } from 'react'
import './App.css'

const colors = ['#d95d39', '#e9a23b', '#a8b86b', '#6f8f78', '#7185a5', '#b7818c']

function normalizeName(name) {
  return name.trim().toLocaleLowerCase()
}

function getFamilyKey(participant) {
  return normalizeName(participant.familyName)
}

function hasValidDrawAssignment(drawers, recipients) {
  if (drawers.length !== recipients.length) return false

  const matchedDrawerByRecipient = new Map()

  function matchDrawer(drawer, visitedRecipients) {
    for (const recipient of recipients) {
      if (getFamilyKey(drawer) === getFamilyKey(recipient) || visitedRecipients.has(recipient.id)) continue
      visitedRecipients.add(recipient.id)

      const currentMatch = matchedDrawerByRecipient.get(recipient.id)
      if (!currentMatch || matchDrawer(currentMatch, visitedRecipients)) {
        matchedDrawerByRecipient.set(recipient.id, drawer)
        return true
      }
    }

    return false
  }

  return drawers.every((drawer) => matchDrawer(drawer, new Set()))
}

function getSegmentPath(index, total, radius) {
  if (total === 1) {
    return `M ${radius} ${radius} m 0 -${radius} a ${radius} ${radius} 0 1 1 0 ${radius * 2} a ${radius} ${radius} 0 1 1 0 -${radius * 2}`
  }

  const startAngle = (index / total) * Math.PI * 2 - Math.PI / 2
  const endAngle = ((index + 1) / total) * Math.PI * 2 - Math.PI / 2
  const start = [radius + radius * Math.cos(startAngle), radius + radius * Math.sin(startAngle)]
  const end = [radius + radius * Math.cos(endAngle), radius + radius * Math.sin(endAngle)]
  const largeArc = total === 1 ? 1 : 0

  return `M ${radius} ${radius} L ${start[0]} ${start[1]} A ${radius} ${radius} 0 ${largeArc} 1 ${end[0]} ${end[1]} Z`
}

function App() {
  const [participants, setParticipants] = useState([])
  const [firstName, setFirstName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [remaining, setRemaining] = useState([])
  const [drawnDrawerIds, setDrawnDrawerIds] = useState([])
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState('')
  const [currentDrawer, setCurrentDrawer] = useState('')
  const [drawerFirstName, setDrawerFirstName] = useState('')
  const [drawerFamilyName, setDrawerFamilyName] = useState('')
  const [drawerError, setDrawerError] = useState('')
  const [isDrawerDialogOpen, setIsDrawerDialogOpen] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [message, setMessage] = useState('')

  function addParticipants(event) {
    event.preventDefault()
    const givenName = firstName.trim()
    const surname = familyName.trim()
    if (!givenName || !surname) {
      setMessage('Enter both a first name and a family name.')
      return
    }

    const name = `${givenName} ${surname}`
    const id = normalizeName(name)
    if (participants.some((participant) => participant.id === id)) {
      setMessage(`${name} is already on the list.`)
      return
    }

    const participant = { id, firstName: givenName, familyName: surname, name }
    setParticipants((current) => [...current, participant])
    setRemaining((current) => [...current, participant])
    setFirstName('')
    setFamilyName('')
    setMessage(`${name} added to the list.`)
  }

  function removeParticipant(name) {
    setParticipants((current) => current.filter((participant) => participant.name !== name))
    setRemaining((current) => current.filter((participant) => participant.name !== name))
    if (winner === name) setWinner('')
    setMessage(`${name} removed from the list.`)
  }

  function startGame() {
    if (participants.length < 2) {
      setMessage('Add at least two guests to start the draw.')
      return
    }

    if (!hasValidDrawAssignment(participants, participants)) {
      setMessage('These family groups cannot be matched without same-family draws. Add guests from other families.')
      return
    }

    setRemaining(participants)
    setIsGameStarted(true)
    setMessage('')
  }

  function openDrawerDialog() {
    if (isSpinning || remaining.length === 0 || !isGameStarted) return
    setDrawerFirstName('')
    setDrawerFamilyName('')
    setDrawerError('')
    setIsDrawerDialogOpen(true)
  }

  function spinWheel(event) {
    event.preventDefault()
    if (isSpinning || remaining.length === 0 || !isGameStarted) return
    const givenName = drawerFirstName.trim()
    const surname = drawerFamilyName.trim()
    if (!givenName || !surname) {
      setDrawerError('Enter both your first name and family name.')
      return
    }

    const drawer = participants.find(
      (participant) =>
        normalizeName(participant.firstName) === normalizeName(givenName) &&
        normalizeName(participant.familyName) === normalizeName(surname),
    )
    if (!drawer) {
      setDrawerError('That name is not on the guest list.')
      return
    }
    if (drawnDrawerIds.includes(drawer.id)) {
      setDrawerError('You have already drawn this round.')
      return
    }

    const eligibleRecipients = remaining.filter(
      (participant) => getFamilyKey(participant) !== getFamilyKey(drawer),
    )
    const remainingDrawers = participants.filter(
      (participant) => participant.id !== drawer.id && !drawnDrawerIds.includes(participant.id),
    )
    const possibleRecipients = eligibleRecipients.filter((candidate) =>
      hasValidDrawAssignment(
        remainingDrawers,
        remaining.filter((participant) => participant.id !== candidate.id),
      ),
    )
    if (possibleRecipients.length === 0) {
      setDrawerError('There are no valid recipients left for this draw. Start a new round.')
      return
    }

    setDrawerError('')
    setIsDrawerDialogOpen(false)
    setCurrentDrawer(drawer.name)

    const winnerIndex = Math.floor(Math.random() * possibleRecipients.length)
    const selectedWinner = possibleRecipients[winnerIndex]
    const wheelIndex = participants.findIndex((participant) => participant.id === selectedWinner.id)
    const segmentAngle = 360 / participants.length
    const centerAngle = (wheelIndex + 0.5) * segmentAngle
    const currentAngle = ((rotation % 360) + 360) % 360
    const alignment = (360 - centerAngle - currentAngle + 360) % 360

    setIsSpinning(true)
    setWinner('')
    setMessage('')
    setRotation(rotation + 360 * 6 + alignment)

    window.setTimeout(() => {
      setWinner(selectedWinner.name)
      setRemaining((current) => current.filter((participant) => participant.id !== selectedWinner.id))
      setDrawnDrawerIds((current) => [...current, drawer.id])
      setIsSpinning(false)
    }, 4200)
  }

  function startNewRound() {
    setRemaining(participants)
    setDrawnDrawerIds([])
    setWinner('')
    setCurrentDrawer('')
    setIsGameStarted(true)
    setMessage('A fresh round is ready!')
  }

  function acknowledgeResult() {
    setWinner('')
    setCurrentDrawer('')
  }

  function resetGame() {
    setParticipants([])
    setRemaining([])
    setDrawnDrawerIds([])
    setIsGameStarted(false)
    setWinner('')
    setFirstName('')
    setFamilyName('')
    setCurrentDrawer('')
    setDrawerFirstName('')
    setDrawerFamilyName('')
    setIsDrawerDialogOpen(false)
    setDrawerError('')
    setMessage('')
    setRotation(0)
  }

  const roundComplete = participants.length > 0 && remaining.length === 0
  const canSpin = isGameStarted && remaining.length > 0 && !isSpinning

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Gift Draw home">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>little traditions</span>
        </a>
        <span className="occasion-tag"><span aria-hidden="true">✦</span> THE GIFT EXCHANGE</span>
      </header>

      <section className="intro">
        <p className="eyebrow">A LITTLE SPIN, A LOT OF JOY</p>
        <h1>Make the<br /><span>gift exchange</span> magic.</h1>
        <p className="intro-copy">Gather your people. Give the wheel a spin.<br className="desktop-break" /> Let the good gifting begin.</p>
      </section>

      <section className="game-card" aria-label="Gift exchange draw">
        <div className="setup-panel">
          <div className="section-heading">
            <span className="step-number">01</span>
            <div>
              <h2>Who's in the mix?</h2>
              <p>Add everyone joining the exchange.</p>
            </div>
          </div>

          {isGameStarted ? (
            <div className="private-list-notice">
              <span className="private-lock" aria-hidden="true">✳</span>
              <p>The guest list is hidden while you draw.</p>
              <span>{participants.length} guests in this exchange</span>
            </div>
          ) : (
            <>
              <form className="name-form" onSubmit={addParticipants}>
                <div className="name-fields">
                  <div>
                    <label htmlFor="first-name">FIRST NAME</label>
                    <input
                      id="first-name"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Maya"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="family-name">FAMILY NAME</label>
                    <input
                      id="family-name"
                      type="text"
                      autoComplete="family-name"
                      value={familyName}
                      onChange={(event) => setFamilyName(event.target.value)}
                      placeholder="Rivera"
                      required
                    />
                  </div>
                </div>
                <button className="add-button" type="submit">
                  Add guest <span aria-hidden="true">+</span>
                </button>
                <p className="form-message">Add each guest by first and family name.</p>
              </form>

              <div className="guest-list">
                <div className="list-heading">
                  <span>THE GUEST LIST</span>
                  <span className="guest-count">{participants.length} {participants.length === 1 ? 'person' : 'people'}</span>
                </div>
                {participants.length === 0 ? (
                  <p className="empty-list">Your list is waiting for its first name.</p>
                ) : (
                  <ul>
                    {participants.map((participant, index) => (
                      <li key={participant.id}>
                        <span className="guest-dot" style={{ '--guest-color': colors[index % colors.length] }} />
                        <span className="guest-name">{participant.name}</span>
                        <button
                          className="remove-button"
                          type="button"
                          onClick={() => removeParticipant(participant.name)}
                          aria-label={`Remove ${participant.name}`}
                        >×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="form-message" aria-live="polite">{message}</p>
              <button className="spin-button start-game-button" type="button" onClick={startGame}>
                Start the draw <span aria-hidden="true">↗</span>
              </button>
            </>
          )}
          {participants.length > 0 && (
            <button className="reset-button" type="button" onClick={resetGame} disabled={isSpinning}>
              Start over
            </button>
          )}
        </div>

        <div className="wheel-panel">
          <div className="wheel-topline">
            <div className="section-heading">
              <span className="step-number">02</span>
              <div>
                <h2>Leave it to fate.</h2>
                <p>{roundComplete ? 'Everyone has their match!' : 'One lucky name, one lovely surprise.'}</p>
              </div>
            </div>
            <span className="round-count">{remaining.length} LEFT</span>
          </div>

          <div className="wheel-stage">
            <span className="pointer" aria-hidden="true" />
            <div className={`wheel ${isSpinning ? 'wheel-spinning' : ''}`} style={{ transform: `rotate(${rotation}deg)` }}>
              <svg viewBox="0 0 320 320" role="img" aria-label={participants.length ? `Roulette wheel with ${participants.length} names` : 'Empty gift roulette wheel'}>
                <circle cx="160" cy="160" r="157" fill="#fffaf2" />
                {participants.length > 0 ? (
                  participants.map((participant, index) => {
                    return (
                      <g key={participant.id}>
                        <path d={getSegmentPath(index, participants.length, 154)} fill={colors[index % colors.length]} stroke="#fffaf2" strokeWidth="2" />
                      </g>
                    )
                  })
                ) : (
                  Array.from({ length: 8 }, (_, index) => (
                    <path
                      key={index}
                      d={getSegmentPath(index, 8, 154)}
                      fill={colors[index % colors.length]}
                      stroke="#fffaf2"
                      strokeWidth="2"
                      opacity="0.48"
                    />
                  ))
                )}
                <circle cx="160" cy="160" r="18" fill="#fffaf2" />
                <circle cx="160" cy="160" r="7" fill="#342e29" />
              </svg>
            </div>
            <div className="wheel-shadow" aria-hidden="true" />
          </div>

          <button
            className="spin-button"
            type="button"
            onClick={roundComplete ? startNewRound : openDrawerDialog}
            disabled={!roundComplete && !canSpin}
          >
            {isSpinning ? 'The wheel is spinning...' : roundComplete ? 'Start a new round' : winner ? 'Draw the next name' : 'Spin the wheel'}
            <span aria-hidden="true">{isSpinning ? '✦' : roundComplete ? '↻' : '↗'}</span>
          </button>
          <p className="wheel-caption">
            {participants.length === 0
              ? 'Add your guests to bring the wheel to life.'
              : roundComplete
                ? 'Every name drawn, no one left out.'
                : 'No repeats — everyone gets a turn.'}
          </p>
        </div>
      </section>

      {isDrawerDialogOpen && (
        <div className="dialog-backdrop">
          <section className="drawer-dialog" role="dialog" aria-modal="true" aria-labelledby="drawer-dialog-title">
            <p className="eyebrow">BEFORE THE SPIN</p>
            <h2 id="drawer-dialog-title">Who's drawing?</h2>
            <p>Enter your name, then let's see who you're gifting.</p>
            <form onSubmit={spinWheel}>
              <div className="name-fields">
                <div>
                  <label htmlFor="drawer-first-name">FIRST NAME</label>
                  <input
                    id="drawer-first-name"
                    type="text"
                    autoComplete="given-name"
                    value={drawerFirstName}
                    onChange={(event) => {
                      setDrawerFirstName(event.target.value)
                      setDrawerError('')
                    }}
                    placeholder="First name"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label htmlFor="drawer-family-name">FAMILY NAME</label>
                  <input
                    id="drawer-family-name"
                    type="text"
                    autoComplete="family-name"
                    value={drawerFamilyName}
                    onChange={(event) => {
                      setDrawerFamilyName(event.target.value)
                      setDrawerError('')
                    }}
                    placeholder="Family name"
                    required
                  />
                </div>
              </div>
              {drawerError && <p className="dialog-error" role="alert">{drawerError}</p>}
              <div className="dialog-actions">
                <button className="cancel-button" type="button" onClick={() => setIsDrawerDialogOpen(false)}>Cancel</button>
                <button className="spin-button" type="submit">Continue <span aria-hidden="true">↗</span></button>
              </div>
            </form>
          </section>
        </div>
      )}

      {winner && (
        <div className="dialog-backdrop result-backdrop">
          <section className="drawer-dialog result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-dialog-title">
            <p className="eyebrow">YOUR GIFT MATCH</p>
            <h2 id="result-dialog-title">{winner}</h2>
            <p>{currentDrawer}, this is your person to gift.</p>
            <button className="spin-button result-ok-button" type="button" onClick={acknowledgeResult}>
              OK <span aria-hidden="true">✓</span>
            </button>
          </section>
        </div>
      )}

      <footer className="page-footer">
        <span>MADE FOR THE MOMENTS THAT MATTER</span>
        <span>✳ &nbsp; HAPPY GIFTING &nbsp; ✳</span>
      </footer>
    </main>
  )
}

export default App
