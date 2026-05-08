# localview

Easily access a localhost website from your mobile device.

## Usage

1. Start your localhost server.
2. Create a QR code with localview.

```bash
npx localview --port 8080
```

3. To visit the exposed URL, scan the QR code with your mobile device.

![Demo](./static/demo.gif)

## Options

| Flag           | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| `--port`, `-P` | Port exposed by the local server. **Required.**               |
| `--path`       | Path appended to the URL (e.g. `/admin`). Optional.           |
| `--host`       | Override the auto-detected LAN IP (Docker, multi-NIC, demos). |

### Examples

```bash
# Deep-link to a specific route:
npx localview --port 3000 --path /admin

# Pin the LAN IP yourself instead of auto-detecting:
npx localview --port 8080 --host 192.168.1.42
```

If multiple non-internal IPv4 interfaces are detected (e.g. wifi + VPN + Docker bridges), localview prints a numbered list and asks which one to use; press Enter to accept the smart default.

## Notes

- Requires Node.js `^20.19.0`, `^22.12.0`, or `>=23`.
- Both the server and the mobile device need to be connected to the same network.
- You may need to set your server's host to `0.0.0.0`.

## License

[MIT](https://opensource.org/licenses/MIT)
