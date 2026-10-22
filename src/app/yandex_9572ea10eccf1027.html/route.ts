export function GET() {
  return new Response(
    `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: 9572ea10eccf1027</body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
    }
  )
}
