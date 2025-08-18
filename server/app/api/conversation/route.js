(()=>{var e={};e.id=851,e.ids=[851],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},1995:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>v,routeModule:()=>d,serverHooks:()=>g,workAsyncStorage:()=>l,workUnitAsyncStorage:()=>m});var n={};r.r(n),r.d(n,{POST:()=>c});var o=r(6559),s=r(8088),a=r(7719),i=r(2190),p=r(1397);async function c(e){try{let{message:t,language:r="th",conversationHistory:n=[],context:o={}}=await e.json(),s=(0,p.p2)(),a=await u(t,s,n,r,o);return i.NextResponse.json({response:a,language:r,practice:s.id})}catch(e){return console.error("Conversation API error:",e),i.NextResponse.json({response:"ขออภัยค่ะ ขณะนี้ระบบมีปัญหา กรุณาลองใหม่ในอีกสักครู่ค่ะ",language:"th",practice:"beautymed"})}}async function u(e,t,r,n,o){try{let s=r.map(e=>`User: ${e.user}
Robin: ${e.agent}`).join("\n"),a=Object.entries(o).map(([e,t])=>`${e}: ${t}`).join(", "),i="th"===n?`คุณคือ Robin ผู้ช่วยนัดหมายของ ${t.name} คลินิกความงาม 
         ดูแลโดย ${t.doctor} ซึ่งเชี่ยวชาญด้าน ${t.type}
         
         บริการที่มี: ${t.services.map(e=>`${e.name} - ${e.description}`).join(", ")}
         
         บทบาทของคุณ:
         - ตอบคำถามเกี่ยวกับบริการและการรักษา
         - ช่วยนัดหมายและให้ข้อมูลเวลาที่ว่าง
         - พูดคุยแบบเป็นมิตรและเข้าใจง่าย
         - ใช้ภาษาไทยที่สุภาพและอ่อนน้อม
         - ตอบเป็นภาษาไทยเท่านั้น ห้ามใช้ภาษาอื่น
         
         ข้อมูลปัจจุบันของลูกค้า: ${a||"ยังไม่มี"}
         
         ตอบแบบสั้นกะทัดรัด ไม่เกิน 2-3 ประโยค
         
         ประวัติการสนทนา: ${s}
         
         ลูกค้าพูดว่า: "${e}"
         
         กรุณาตอบในบทบาท Robin เป็นภาษาไทยเท่านั้น:`:`You are Robin, the appointment assistant for ${t.name} beauty clinic.
         Managed by ${t.doctor}, specializing in ${t.type}.
         
         Available services: ${t.services.map(e=>`${e.name} - ${e.description}`).join(", ")}
         
         Your role:
         - Answer questions about services and treatments
         - Help with appointments and scheduling
         - Be friendly and conversational
         - Keep responses concise (2-3 sentences max)
         
         Current customer context: ${a||"None"}
         
         Conversation history: ${s}
         
         Customer said: "${e}"
         
         Please respond as Robin:`,p=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"Content-Type":"application/json","X-goog-api-key":"AIzaSyB82katqt-X1myT_8Ig5IMFgfABLmNrclY"},body:JSON.stringify({contents:[{parts:[{text:i}]}],generationConfig:{temperature:.7,topK:40,topP:.95,maxOutputTokens:150}})});if(!p.ok)throw Error(`Gemini API error: ${p.status}`);return(await p.json()).candidates[0].content.parts[0].text}catch(e){throw console.error("Gemini API Error:",e),e}}let d=new o.AppRouteRouteModule({definition:{kind:s.RouteKind.APP_ROUTE,page:"/api/conversation/route",pathname:"/api/conversation",filename:"route",bundlePath:"app/api/conversation/route"},resolvedPagePath:"/Users/jovannitilborg/Downloads/Agentsdemo-main/clean-demo/src/app/api/conversation/route.ts",nextConfigOutput:"",userland:n}),{workAsyncStorage:l,workUnitAsyncStorage:m,serverHooks:g}=d;function v(){return(0,a.patchFetch)({workAsyncStorage:l,workUnitAsyncStorage:m})}},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6487:()=>{},8335:()=>{},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[719,580,397],()=>r(1995));module.exports=n})();