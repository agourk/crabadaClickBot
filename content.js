const LOOT_MINES = []
const FIRST_MINES = []
let RUNNING = false

//---MUTATION OBSERVERS
//Observes loading of "Explore" page
const page_observer = new MutationObserver(mutations => {
  mutations.some(mutation => {
    if (mutation.addedNodes.length) {
      if (document.evaluate("//div[text()='Start Looting']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
        page_observer.disconnect()
        refreshFirstMines()
        return true
      }
    }
  })
})

//Observes loading of the first mines
const first_mines_observer = new MutationObserver(mutations => {
  mutations.some(mutation => {
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      if (mutation.addedNodes[i].className && 'row no-result'.includes(mutation.addedNodes[i].className)) {
        first_mines_observer.disconnect()
        setFirstMines()
        return true
      }
    }
  })
})

//Observes loading of mines
const mines_observer = new MutationObserver(async mutations => {
  for (let j = 0; j < mutations.length; j++) {
    for (let i = 0; i < mutations[j].addedNodes.length; i++) {
      if (mutations[j].addedNodes[i].className && 'row no-result'.includes(mutations[j].addedNodes[i].className)) {
        await checkMines()
        return
      }
    }
  }
})

//---FUNCTIONS
//Get first mines to not loot them
async function refreshFirstMines() {
  first_mines_observer.observe(document.getElementsByClassName('mine')[0], {childList: true, subtree: true})
  clickStartLooting()
}

//Sets `first_mines` to avoid
async function setFirstMines() {
  const mines = document.querySelectorAll('div.items-icon')
  mines.forEach(mine => {
    FIRST_MINES.push(mine.parentElement.textContent.split('\u00A0')[1].split(' ')[0])
  })
  mines_observer.observe(document.getElementsByClassName('mine')[0], {childList: true, subtree: true})
  clickStartLooting()
}

//Checks for the "Select" button to trigger the Captcha
async function checkSelect() {
  let clicked = false;
  let loops = 0;
  while (!clicked && loops < 1000) {
    buttons = document.getElementsByClassName('ant-btn btn btn-primary')
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent == 'Select') {
        buttons[i].click()
        clicked = true
        break
      }
    }
    await new Promise(r => setTimeout(r, 10))
    loops += 10;
  }
}

//Infinite loop that refreshes available mines and clicks the correct ones
async function checkMines() {
  const mines = document.querySelectorAll('div.items-icon')
  await new Promise(r => setTimeout(r, 10))
  for (let i = 0; i < 7 && i < mines.length; ++i) {
    const mine_id = mines[i].parentElement.textContent.split('\u00A0')[1].split(' ')[0]
    const mine_type = mines[i].firstChild.getAttribute('data-tooltip')
    if (!FIRST_MINES.includes(mine_id) && LOOT_MINES.includes(mine_type)) {
      mines_observer.disconnect()
      mines[i].parentElement.children[2].getElementsByTagName('button')[0].click()
      await checkSelect()
      RUNNING = false
      console.log('Bot ended')
      return
    }
  }
  clickStartLooting()
}

//Sets the mines to loot
function setLootMines(attack_types) {
  LOOT_MINES.length = 0
  attack_types.forEach(type => LOOT_MINES.push(type))
  if (LOOT_MINES.length == 0)
    return false
  return true
}

//Clicks the "Start looting" button to refresh mines
function clickStartLooting() {
  document.evaluate("//div[text()='Start Looting']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
}

//Starts when extension sends `startBot` message
chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  if (msg.action === 'startBot') {
    if (!window.location.href.includes('play.crabada.com/mine'))
      return sendResponse('KO')
    if (setLootMines(msg.attack_types, sendResponse) == false)
      return sendResponse('NO_TYPES')
    if (RUNNING)
      return sendResponse('RUNNING')
    console.log('Crabada clicker bot started\nSearching for:', LOOT_MINES);
    RUNNING = true
    if (document.evaluate("//div[text()='Start Looting']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
      refreshFirstMines()
    else
      page_observer.observe(document, {childList: true, subtree: true})
    sendResponse('OK')
  }
})
