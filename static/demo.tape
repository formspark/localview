# vhs tape for the README demo gif.
#
# Install: https://github.com/charmbracelet/vhs#installation
# Regenerate: vhs static/demo.tape  (writes static/demo.gif)
#
# During development before publishing, swap `npx localview` for
# `node dist/cli.js` after `npm run build`.

Output static/demo.gif

Set FontSize 14
Set Width 900
Set Height 600
Set Padding 20
Set Theme "Catppuccin Mocha"

# --host pins the IP shown in the QR/URL so the demo doesn't leak
# the recording machine's real LAN address.
Type "npx localview --port 8080 --host 192.168.1.42"
Sleep 500ms
Enter
Sleep 4s
