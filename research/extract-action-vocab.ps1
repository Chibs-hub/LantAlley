$ErrorActionPreference = 'Stop'

$sourceDir = Join-Path $PSScriptRoot 'openjlpt'
$outputFile = Join-Path $PSScriptRoot 'jlpt-n5-n2-action-vocabulary.csv'

$visible = 'bathe|shower|walk|run|enter|leave|exit|stand|sit|bow|wave|jump|climb|fall|turn|stop|move|cross|carry|lift|hold|grasp|put|place|take|pick|open|close|push|pull|throw|catch|kick|hit|touch|wash|wear|dress|remove|eat|drink|cook|cut|write|read|look|watch|listen|smile|laugh|cry|sleep|wake|dance|sing|swim|drive|ride|shake|nod|point|kneel|hide|chase|follow|escape|drop|break|bend|stretch|build|dig|plant|clean|wipe'
$social = 'greet|ask|answer|speak|say|talk|chat|explain|apologi|invite|refuse|agree|promise|help|call|contact|warn|encourage|thank|praise|introduce|meet|visit|guide|show|give|receive|offer|request|consult|persuade|argue|complain|report|announce|order|command|permit|forbid|celebrate|congratulate|welcome|protect|rescue|support|cooperate'
$object = 'buy|sell|pay|shop|reserve|book|borrow|return|send|submit|deliver|use|operate|repair|fix|choose|select|search|check|confirm|copy|print|pack|wrap|unlock|lock|switch|connect|attach|fill|empty|pour|measure|count|exchange|replace|charge|cancel|postpone|prepare|organize|arrange|record|save|delete|press|insert|remove|turn on|turn off'

function Get-Setting([string]$meaning) {
  if ($meaning -match 'train|bus|station|ticket|board|ride|drive|cross|traffic|travel|depart|arrive') { return 'station / street / travel' }
  if ($meaning -match 'buy|sell|pay|shop|price|exchange|choose|order') { return 'shop / market' }
  if ($meaning -match 'eat|drink|cook|cut|pour|order|serve|taste') { return 'restaurant / kitchen' }
  if ($meaning -match 'study|teach|learn|read|write|answer|question|practice|borrow|return') { return 'school / library' }
  if ($meaning -match 'work|submit|report|print|copy|meeting|manage|approve|contact') { return 'office / workplace' }
  if ($meaning -match 'injure|hurt|heal|examine|medicine|rescue|protect|escape|evacuate') { return 'clinic / emergency' }
  if ($meaning -match 'sleep|wake|wash|shower|bathe|dress|clean|open|close') { return 'home / inn' }
  if ($meaning -match 'greet|apologi|invite|thank|promise|praise|introduce|chat|talk|speak') { return 'social encounter' }
  if ($meaning -match 'walk|run|jump|climb|swim|plant|dig|chase|follow') { return 'street / park / outdoors' }
  return 'general dialogue / flexible setting'
}

$rows = foreach ($level in 'n5', 'n4', 'n3', 'n2') {
  $items = Get-Content -Raw -LiteralPath (Join-Path $sourceDir "$level.json") | ConvertFrom-Json
  foreach ($item in $items) {
    $meaning = $item.meanings -join '; '
    if ($meaning -notmatch '(^|; )to\s') { continue }

    $type = if ($meaning -match $visible) { 'visible movement' }
      elseif ($meaning -match $social) { 'social / dialogue action' }
      elseif ($meaning -match $object) { 'object / interface action' }
      else { 'state / thought / contextual verb' }

    [pscustomobject]@{
      jlpt_level = $level.ToUpperInvariant()
      word = $item.word
      reading = $item.reading
      meanings = $meaning
      action_type = $type
      suggested_setting = Get-Setting $meaning
    }
  }
}

$rows | Export-Csv -LiteralPath $outputFile -NoTypeInformation -Encoding utf8NoBOM
$rows | Group-Object jlpt_level, action_type | Sort-Object Name | ForEach-Object {
  "{0}: {1}" -f $_.Name, $_.Count
}
"Total: $($rows.Count)"
"Wrote: $outputFile"
