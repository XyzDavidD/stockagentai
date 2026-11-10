import test from 'node:test';import assert from 'node:assert/strict';
import {allowedDocumentUrl,extractDocument,inspectDocument,enrichDocuments,documentStore} from '../scripts/documents.mjs';
const url='https://www.anthropic.com/news/example';
const paragraph='Company announces its initial public offering roadshow and explains that completion remains subject to market conditions and regulatory approval, without any confirmed trading date for its shares.';
const html=`<meta property="article:published_time" content="2026-11-10T00:00:00Z"><article><h1>IPO news</h1><p>${paragraph}</p><aside><p>IPO unrelated navigation</p></aside><script>IPO malicious instructions</script></article>`;
test('article destinations are restricted to observed publishers and paths',()=>{
 assert.equal(allowedDocumentUrl(url),url);
 for(const u of ['https://127.0.0.1/news/x','https://www.anthropic.com.evil.com/news/x','https://www.anthropic.com:444/news/x','https://user:pass@www.anthropic.com/news/x','https://www.anthropic.com/news/x?redirect=evil','http://www.anthropic.com/news/x','https://www.anthropic.com/api/x'])assert.equal(allowedDocumentUrl(u),null);
});
test('extracts bounded quote, omits navigation, dates only from explicit metadata',()=>{
 const doc=extractDocument(html,url);assert.equal(doc.excerpt.split(/\s+/).length,20);assert.equal(doc.paragraph_count,1);assert.equal(doc.publication_date,'2026-11-10T00:00:00.000Z');assert.equal(doc.excerpt_truncated,true);assert.equal(doc.content_hash.length,64);
 assert.equal(extractDocument(html.replace('2026-11-10T00:00:00Z','yesterday'),url).publication_date,null);
});
test('missing article or relevant prose fails rather than fabricating evidence',()=>{
 for(const content of ['<body>Access denied</body>','<article><h1>IPO</h1><p>Subscribe</p></article>'])assert.throws(()=>extractDocument(content,url));
});
test('denied URLs are never fetched and access denials never retried',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return new Response('',{status:403});};
 assert.equal((await inspectDocument({url:'https://evil.com',content_hash:'a'},{fetcher})).error,'DOCUMENT_URL_NOT_ALLOWED');assert.equal(calls,0);
 const result=await inspectDocument({url,content_hash:'a'},{fetcher});assert.equal(result.error,'HTTP_403');assert.equal(result.evidence,null);assert.equal(calls,1);
});
test('per-run cap and persistence failures stop work',async()=>{
 let saved=0;const store={queue:async()=>Array.from({length:9},()=>({url,content_hash:'a'})),save:async()=>saved++};
 assert.equal((await enrichDocuments({store,fetcher:async()=>new Response(html),wait:async()=>{}})).length,4);assert.equal(saved,4);
 await assert.rejects(enrichDocuments({store:{...store,save:async()=>{throw new Error('DB_FAILED');}},fetcher:async()=>new Response(html)}),/DB_FAILED/);
});
test('document store credentials cannot leak in transport errors',async()=>{
 const store=documentStore({url:'https://abc.supabase.co',key:'sb_secret_example',fetcher:async()=>{throw new Error('header sb_secret_example');}});
 await assert.rejects(store.queue(),{message:'DOCUMENT_STORE_NETWORK_ERROR'});
});
