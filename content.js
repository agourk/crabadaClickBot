const LOOT_MINES = []
const FIRST_MINES = []
let RUNNING = false

//Observes loading of main page
const page_observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length) {
      if (document.evaluate("//div[text()='Start Looting']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
        page_observer.disconnect()
        refresh_first_mines()
      }
    }
  })
})

//Observes loading of mines
const first_mines_observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      if (mutation.addedNodes[i].className && 'row no-result'.includes(mutation.addedNodes[i].className)) {
        first_mines_observer.disconnect()
        set_first_mines()
      }
    }
  })
})

//Observes loading of mines
const mines_observer = new MutationObserver(async mutations => {
  mutations.forEach(async mutation => {
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      if (mutation.addedNodes[i].className && 'row no-result'.includes(mutation.addedNodes[i].className)) {
        await check_mines()
      }
    }
  })
})

//Observes loading of "attack" button
const attack_observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      if (mutation.addedNodes[i].className == 'mine-detail') {
        attack_observer.disconnect()
        select_observer.observe(document.body, {childList: true, subtree: true})
        document.getElementById('attackBtn').click()
      }
    }
  })
})

//Observes loading of "select" button
const select_observer = new MutationObserver(mutations => {
  mutations.forEach(async mutation => {
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      if (mutation.addedNodes[i].className == 'ant-modal-root') {
        select_observer.disconnect()
        await new Promise(r => setTimeout(r, 500))
        try {
          document.evaluate("//span[text()='Select']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.parentElement.click()
        } catch {}
      }
    }
  })
})

//Get first mines to not loot them
async function refresh_first_mines() {
  first_mines_observer.observe(document.getElementsByClassName('mine')[0], {childList: true, subtree: true})
  document.evaluate("//div[text()='Start Looting']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
}

//Set `first_mines` to not loot them
async function set_first_mines() {
  const mines = document.querySelectorAll('div.items-icon')
  mines.forEach(mine => {
    FIRST_MINES.push(mine.parentElement.textContent.split('\u00A0')[1].split(' ')[0])
  })
  mines_observer.observe(document.getElementsByClassName('mine')[0], {childList: true, subtree: true})
  document.evaluate("//div[text()='Start Looting']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
}

//Infinite loop that refreshes available mines and clicks the correct ones
async function check_mines() {
  const mines = document.querySelectorAll('div.items-icon')
  await new Promise(r => setTimeout(r, 10))
  for (let i = 0; i < 7 && i < mines.length; ++i) {
    const mine_id = mines[i].parentElement.textContent.split('\u00A0')[1].split(' ')[0]
    const mine_type = mines[i].firstChild.getAttribute('data-tooltip')
    if (!FIRST_MINES.includes(mine_id) && LOOT_MINES.includes(mine_type)) {
      mines_observer.disconnect()
      attack_observer.observe(document.getElementsByClassName('mine')[0], {childList: true, subtree: true})
      mines[i].click()
      console.log('Crabada clicker bot ended')
      RUNNING = false
      return
    }
  }
  document.evaluate("//div[text()='Start Looting']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
}

//Waits for extension to be clicked
chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  if (msg.action === 'startBot') {
    if (window.location.href != 'https://play.crabada.com/mine/start-looting') {
      sendResponse('KO')
      return
    }
    LOOT_MINES.length = 0
    msg.attack_types.forEach(type => LOOT_MINES.push(type))
    if (LOOT_MINES.length == 0) {
      sendResponse('NO_TYPES')
      return
    }
    if (RUNNING) {
      sendResponse('RUNNING')
      return
    }
    console.log('Crabada clicker bot started')
    console.log('Searching for:', LOOT_MINES)
    RUNNING = true
    if (document.evaluate("//div[text()='Start Looting']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
      refresh_first_mines()
    } else {
      page_observer.observe(document, {childList: true, subtree: true})
    }
    sendResponse('OK')
  }
})
