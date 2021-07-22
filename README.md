# localview

Easily access a localhost website from your mobile device.

## Usage

1. Start your localhost server
2. Create a QR code with localview, the `--port` argument should match the port exposed by the server.

```bash
npx localview --port 8080
```

![Screenshot](./static/screenshot.png)

3. To visit the exposed URL, scan the QR code with your mobile device.

## Notes

- Both the server and the mobile device need to be connected to the same network.
- You may need to set you server's host to `0.0.0.0`.

## License

[MIT](https://opensource.org/licenses/MIT)
