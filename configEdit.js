var customConfig = {
  botToken : '',
  trelloKey: '',
  trelloToken: '',

  delayInS: 6, // in seconds
  minuteDelay: 60, // 60 seconds
  maxDelay: 120, // submit message delete timer
  backupTimer: 6, // in hours (for example 24 hours);

  approveAttempts: 3, // number of approvals before the bug is approved
  denyAttempts: 3, // number of denials before the bug is denied

  reproAttempts: 5 // number of repro attempts before they no longer attach to the report in chat
}

module.exports = customConfig;
