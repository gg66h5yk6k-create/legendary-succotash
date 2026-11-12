import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { createAttachmentHandler } from '../netlify/server/attachments.mjs';
import { validateDocument } from '../netlify/server/handler.mjs';
import { portfolioText } from '../portfolio.js';
import { parseHTML } from 'linkedom';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const draft = { values: { 0: 'Amina' }, language: 'de', step: 0 };
function fixture() {
 const rows=new Map(),blobs=new Map(); // Test doubles; production persists in Netlify Database and Blobs.
 const handler=createAttachmentHandler({authenticate:async req=>['alice','bob'].includes(req.headers.get('x-account-id'))?{id:req.headers.get('x-account-id')}:null,
 records:{list:async user=>[...rows.values()].filter(r=>r.userId===user),get:async(user,id)=>rows.get(id)?.userId===user?rows.get(id):null,add:async row=>rows.set(row.id,row),remove:async(user,id)=>rows.delete(id)},
 files:{set:async(key,data)=>blobs.set(key,data),get:async key=>blobs.get(key)||null,delete:async key=>blobs.delete(key)}});
 return async(user,method='GET',id='',file,origin='https://app.test')=>{let body;if(file){body=new FormData();body.append('file',file)}return handler(new Request('https://app.test/api/attachments'+(id?'/'+id:''),{method,headers:{'x-account-id':user,origin},body}))};
}
test('portfolio fields round-trip with legacy documents and reject malformed values',()=>{
 assert.deepEqual(validateDocument(draft),draft);
 const document={...draft,portfolio:{position:'Pflegefachkraft',body:'Sehr geehrtes Team,\n…',includeCover:true,includeLetter:false,date:'2026-11-12'}};
 assert.deepEqual(validateDocument(document),document);
 assert.equal(validateDocument({...draft,portfolio:{includeCover:'yes'}}),null);
 assert.equal(validateDocument({...draft,portfolio:{date:'invalid'}}),null);
 assert.equal(validateDocument({...draft,portfolio:{body:'x'.repeat(20001)}}),null);
 for(const language of ['de','en','ar','fr','ru','tr','hi']){const d=portfolioText(language);assert.ok(d.portfolio&&d.export&&d.limits&&d.body)}
});
test('uploads persist and only their owner can download or delete them',async()=>{
 const call=fixture();const pdf=await PDFDocument.create();pdf.addPage();const bytes=await pdf.save();
 const uploaded=await call('alice','POST','',new File([bytes],'Zeugnis.pdf',{type:'application/pdf'}));assert.equal(uploaded.status,201);const row=await uploaded.json();
 assert.equal((await(await call('alice')).json()).length,1);
 assert.equal((await(await call('bob')).json()).length,0);
 assert.equal((await call('bob','GET',row.id)).status,404);
 assert.equal((await call('bob','DELETE',row.id)).status,404);
 const response=await call('alice','GET',row.id);assert.equal(response.headers.get('content-type'),'application/pdf');assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);
 assert.equal((await call('alice','DELETE',row.id)).status,200);assert.equal((await(await call('alice')).json()).length,0);
});
test('uploads reject anonymous access, forged formats and oversized files',async()=>{
 const call=fixture();assert.equal((await call('guest')).status,401);
 for(const file of [new File(['bad'],'fake.pdf',{type:'application/pdf'}),new File(['bad'],'fake.png',{type:'image/png'}),new File(['<script>'],'file.html',{type:'text/html'}),new File([new Uint8Array(10*1024*1024+1)],'large.jpg',{type:'image/jpeg'})])assert.ok([400,413].includes((await call('alice','POST','',file)).status));
 assert.equal((await call('alice','POST','',new File(['x'],'fake.pdf',{type:'application/pdf'}),'https://other.test')).status,403);
});
test('portfolio editor restores text, escapes preview content and signals autosave',()=>{
 const {document,window}=parseHTML(readFileSync(new URL('../index.html',import.meta.url),'utf8'));
 const context=vm.createContext({document,window,Intl,Date,setTimeout,URL});
 vm.runInContext(readFileSync(new URL('../portfolio.js',import.meta.url),'utf8').replaceAll('export const ','const ').replaceAll('export function ','function '),context);
 let changes=0;const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const portfolio=context.initPortfolio({$:s=>document.querySelector(s),language:()=> 'de',values:()=>({0:'Amina'}),escapeHtml:esc,resumeHTML:()=>'<h2>CV</h2>',changed:()=>changes++,account:()=>({isReady:()=>false})});
 portfolio.setData({position:'<script>alert(1)</script>',body:'Ein gespeichertes Anschreiben'});portfolio.render();
 assert.equal(document.querySelector('#map-body').value,'Ein gespeichertes Anschreiben');
 assert.equal(document.querySelector('#portfolio-mini script'),null);
 const body=document.querySelector('#map-body');body.value='Neuer Text';body.dispatchEvent(new window.Event('input',{bubbles:true}));
 assert.equal(portfolio.getData().body,'Neuer Text');assert.equal(changes,1);
});

test('complete app initialization preserves portfolio alongside CV during account load and save',()=>{
 const {document,window}=parseHTML(readFileSync(new URL('../index.html',import.meta.url),'utf8'));
 // Linkedom models select.value as read-only; provide the browser-compatible setter for this test.
 const select=document.querySelector('#language');let selected='de';Object.defineProperty(select,'value',{get:()=>selected,set:value=>{selected=value}});
 let accountOptions;
 const context=vm.createContext({document,window,Intl,Date,setTimeout,URL,console,
 installAccountTranslations:()=>{},initAccount:options=>{accountOptions=options;return {refreshUI(){},changed(){}}}});
 vm.runInContext('(function(){'+readFileSync(new URL('../portfolio.js',import.meta.url),'utf8').replaceAll('export const ','const ').replaceAll('export function ','function ')+';globalThis.initPortfolio=initPortfolio;})()',context);
 vm.runInContext(readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,''),context);
 accountOptions.applyDocument({...draft,portfolio:{position:'Büroassistenz',body:'Mein Anschreiben',includeCover:false}});
 const saved=accountOptions.getDocument();assert.equal(saved.portfolio.body,'Mein Anschreiben');assert.equal(saved.values[0],'Amina');assert.equal(saved.portfolio.includeCover,false);
 accountOptions.applyDocument(null);assert.deepEqual(Object.keys(accountOptions.getDocument().portfolio),[]);
});

test('PDF export combines cover, letter, CV and uploaded PDF in one file',async()=>{
 const {document,window}=parseHTML(readFileSync(new URL('../index.html',import.meta.url),'utf8'));
 const originalCreate=document.createElement.bind(document);
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aE1UAAAAASUVORK5CYII=';
 document.createElement=tag=>tag==='canvas'?{width:0,height:0,getContext:()=>({drawImage(){}}),toDataURL:()=>png}:originalCreate(tag);
 const attachment=await PDFDocument.create();attachment.addPage([300,400]);const attachmentBytes=await attachment.save();
 let downloaded;
 const context=vm.createContext({document,window,Intl,Date,Blob,setTimeout:callback=>callback(),PDFDocument,pageSize:()=>[595.28,841.89],
 URL:{createObjectURL:blob=>{downloaded=blob;return 'blob:test'},revokeObjectURL(){}}});
 let source=readFileSync(new URL('../portfolio.js',import.meta.url),'utf8').replaceAll('export const ','const ').replaceAll('export function ','function ');
 source=source.replaceAll('pdf.addPage([595.28,841.89])','pdf.addPage(pageSize())');
 source=source.replace("import('pdf-lib')",'Promise.resolve({PDFDocument:globalThis.PDFDocument})').replace("import('html2canvas')",'Promise.resolve({default:async()=>({width:794,height:1123})})');
 source=source.replace("}catch{if(run===epoch)status='error'}finally{stage", "}catch(error){globalThis.exportError=error;if(run===epoch)status='error'}finally{stage");
 vm.runInContext(source,context);
 const portfolio=context.initPortfolio({$:s=>document.querySelector(s),language:()=> 'de',values:()=>({0:'Amina'}),escapeHtml:value=>String(value||''),resumeHTML:()=>'<h2>CV</h2>',changed(){},account:()=>({isReady:()=>true,flush:async()=>true,request:async path=>path==='/api/attachments'?{json:async()=>[{id:'file-id',name:'Diplom.pdf',contentType:'application/pdf',size:attachmentBytes.length}]}:{arrayBuffer:async()=>attachmentBytes}})});
 document.querySelector('#portfolio-export').dispatchEvent(new window.Event('click'));
 for(let i=0;i<100&&!downloaded;i++)await new Promise(resolve=>setTimeout(resolve,10));
 assert.ok(downloaded,'PDF was downloaded: '+context.exportError?.stack);
 const merged=await PDFDocument.load(await downloaded.arrayBuffer());assert.equal(merged.getPageCount(),4);assert.equal(merged.getPage(3).getWidth(),300);
});
