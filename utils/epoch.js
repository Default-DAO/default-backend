const genesisEpochDate = new Date('April 12, 2021 12:00:00')

function getCurrentEpoch() {
    const today = new Date()
    let difference = (today.getTime() - genesisEpochDate.getTime()) / (1000 * 3600 * 24)
    return Math.ceil(difference / 7)
}

function getCurrentCycle() {
    const today = new Date()
    let difference = (today.getTime() - genesisEpochDate.getTime()) / (1000 * 3600 * 24)
    return Math.ceil(difference / 30)
}

function isFriday() {
    const today = new Date()
    return today.getDay() === 5
}

function isMonday() {
    const today = new Date()
    return today.getDay() === 1
}

module.exports = {
    getCurrentEpoch,
    getCurrentCycle,
    isFriday,
    isMonday
}