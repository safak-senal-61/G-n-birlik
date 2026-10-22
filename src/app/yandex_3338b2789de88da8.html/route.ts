export function GET() {
  return new Response(
    `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: 3338b2789de88da8</body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
    }
  )
}
