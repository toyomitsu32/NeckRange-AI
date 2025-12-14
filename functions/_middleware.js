// Cloudflare Pages Functions - MIMEタイプを修正するミドルウェア

export async function onRequest(context) {
  // 静的アセットの場合は特別な処理
  const url = new URL(context.request.url);
  const pathname = url.pathname;
  
  // JavaScriptファイルの場合
  if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
    try {
      const response = await context.env.ASSETS.fetch(context.request);
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/javascript; charset=utf-8');
      headers.delete('Content-Type'); // 既存のヘッダーを削除
      headers.set('Content-Type', 'text/javascript; charset=utf-8');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
    } catch (e) {
      // ASSETS.fetchが使えない場合は通常の処理
      const response = await context.next();
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/javascript; charset=utf-8');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
    }
  }
  
  // CSSファイルの場合
  if (pathname.endsWith('.css')) {
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/css; charset=utf-8');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  }
  
  // その他のファイルは通常処理
  return context.next();
}
