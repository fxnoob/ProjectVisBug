import hotkeys from 'hotkeys-js'
import { metaKey, getStyle, getSide, showHideSelected } from '../utilities/'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1)

const command_events = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down`

export function Padding(visbug) {
  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault()
    padElement(visbug.selection(), handler.key)
  })

  hotkeys(command_events, (e, handler) => {
    e.preventDefault()
    padAllElementSides(visbug.selection(), handler.key)
  })

  visbug.onSelectedUpdate(paintBackgrounds)

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right') // bug in lib?
    visbug.removeSelectedCallback(paintBackgrounds)
    removeBackgrounds(visbug.selection())
  }
}

export function padElement(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({
      el,
      style:    'padding' + getSide(direction),
      current:  parseInt(getStyle(el, 'padding' + getSide(direction)), 10),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('alt'),
    }))
    .map(payload =>
      Object.assign(payload, {
        padding: payload.negative
          ? payload.current - payload.amount
          : payload.current + payload.amount
      }))
    .forEach(({el, style, padding}) =>
      el.style[style] = `${padding < 0 ? 0 : padding}px`)
}

export function padAllElementSides(els, keycommand) {
  const combo = keycommand.split('+')
  let spoof = ''

  if (combo.includes('shift'))  spoof = 'shift+' + spoof
  if (combo.includes('down'))   spoof = 'alt+' + spoof

  'up,down,left,right'.split(',')
    .forEach(side => padElement(els, spoof + side))
}

function paintBackgrounds(els) {
  els.forEach(el => {
    const label_id = el.getAttribute('data-label-id')

    document
      .querySelector(`visbug-label[data-label-id="${label_id}"]`)
      .style.opacity = 0

    document
      .querySelector(`visbug-handles[data-label-id="${label_id}"]`)
      .backdrop = {
        element:  createVisual(el, label_id),
        update:   createVisual,
      }
  })
}

function removeBackgrounds(els) {
  els.forEach(el => {
    const label_id = el.getAttribute('data-label-id')

    document
      .querySelector(`visbug-label[data-label-id="${label_id}"]`)
      .style.opacity = 1

    document
      .querySelector(`visbug-handles[data-label-id="${label_id}"]`)
      .$shadow.querySelector('visbug-boxmodel').remove()
  })
}

function createVisual(el, label_id) {
  const bounds            = el.getBoundingClientRect()
  const styleOM           = el.computedStyleMap()
  const calculatedStyle   = getStyle(el, 'padding')

  const sides = {
    top:    styleOM.get('padding-top').value,
    right:  styleOM.get('padding-right').value,
    bottom: styleOM.get('padding-bottom').value,
    left:   styleOM.get('padding-left').value,
  }
  
  if (calculatedStyle === '0px')
    return

  const boxdisplay = document.createElement('visbug-boxmodel')
  boxdisplay.position = { mode: 'padding', bounds, sides }

  return boxdisplay
}
