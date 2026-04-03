Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
q = Chr(34)
dir = fso.GetParentFolderName(WScript.ScriptFullName)
preflight = fso.BuildPath(dir, "preflight.bat")
runDev = fso.BuildPath(dir, "run_dev.bat")
waitBat = fso.BuildPath(dir, "start_windows_wait.bat")
comspec = sh.ExpandEnvironmentStrings("%ComSpec%")

rc = sh.Run(q & comspec & q & " /c call " & q & preflight & q, 1, True)
If rc <> 0 Then
  MsgBox "Keremflix could not start. Read the messages in the window that just appeared.", vbCritical, "Keremflix"
  WScript.Quit rc
End If

sh.Run q & comspec & q & " /c call " & q & runDev & q, 2, False

waitCmd = q & comspec & q & " /c start " & q & "keremflix-wait" & q & " /min " & q & comspec & q & " /c call " & q & waitBat & q
sh.Run waitCmd, 1, False
