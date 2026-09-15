import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

const SKILLS = ["python","java","javascript","typescript","react","next.js","node.js","express","sql","postgresql","mysql","mongodb","docker","kubernetes","aws","azure","gcp","machine learning","deep learning","nlp","natural language processing","computer vision","pytorch","tensorflow","scikit-learn","pandas","numpy","fastapi","rest api","graphql","git","github","linux","spark","kafka","airflow","langchain","rag","llm","generative ai","embeddings","vector database","faiss","redis","spring boot","html","css","tailwind","figma"];

function tokens(text:string){return new Set(text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g," ").split(/\s+/).filter(x=>x.length>2));}
function localSimilarity(a:string,b:string){const A=tokens(a),B=tokens(b);let common=0;A.forEach(x=>{if(B.has(x))common++});return Math.round(Math.min(1,common/Math.max(1,Math.sqrt(A.size*B.size)))*100);}
function foundSkills(text:string){const t=text.toLowerCase();return SKILLS.filter(s=>t.includes(s.toLowerCase())).map(s=>s.replace(/\b\w/g,c=>c.toUpperCase()));}
function cosine(a:number[],b:number[]){let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return dot/(Math.sqrt(aa)*Math.sqrt(bb)||1);}

async function embedding(text:string){
  const key=process.env.OPENAI_API_KEY;
  if(!key) return null;
  const r=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},body:JSON.stringify({model:"text-embedding-3-small",input:text})});
  if(!r.ok) throw new Error("Embedding service failed");
  const j=await r.json(); return j.data?.[0]?.embedding as number[];
}

async function aiAssessment(resume:string,job:string,semantic:number){
  const key=process.env.OPENAI_API_KEY;
  if(!key) return null;
  const prompt=`You are an expert technical recruiter. Analyze this candidate resume against the job description. Return ONLY valid JSON matching this schema: {"summary":string,"matchedSkills":string[],"missingSkills":string[],"strengths":string[],"gaps":string[],"recommendation":string,"experience":number,"education":number}. Scores are 0-100. Do not invent candidate facts. Keep lists concise (max 8 items).\n\nRESUME:\n${resume.slice(0,18000)}\n\nJOB DESCRIPTION:\n${job.slice(0,18000)}\n\nSemantic similarity already calculated: ${semantic}.`;
  const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},body:JSON.stringify({model:"gpt-4o-mini",temperature:0.1,response_format:{type:"json_object"},messages:[{role:"system",content:"Return strict JSON only."},{role:"user",content:prompt}]})});
  if(!r.ok) throw new Error("AI assessment service failed");
  const j=await r.json(); return JSON.parse(j.choices?.[0]?.message?.content||"{}");
}

export async function POST(req:NextRequest){
  try{
    const form=await req.formData(); const file=form.get("resume"); const job=String(form.get("jobDescription")||"");
    if(!(file instanceof File) || file.type!=="application/pdf") return NextResponse.json({error:"Please upload a PDF resume."},{status:400});
    if(job.trim().length<40) return NextResponse.json({error:"Please provide a fuller job description (at least 40 characters)."},{status:400});
    if(file.size>5_000_000) return NextResponse.json({error:"Resume must be smaller than 5 MB."},{status:400});

    const buffer=Buffer.from(await file.arrayBuffer()); const parsed=await pdf(buffer); const resume=parsed.text.trim();
    if(resume.length<80) return NextResponse.json({error:"I could not extract enough text from this PDF. Try a text-based resume PDF."},{status:400});

    const [re,je]=await Promise.all([embedding(resume),embedding(job)]);
    const semantic=re&&je ? Math.round(((cosine(re,je)+1)/2)*100) : localSimilarity(resume,job);
    const resumeSkills=foundSkills(resume), jobSkills=foundSkills(job);
    const matched=jobSkills.filter(s=>resumeSkills.includes(s));
    const missing=jobSkills.filter(s=>!resumeSkills.includes(s));
    const skillScore=jobSkills.length?Math.round(matched.length/jobSkills.length*100):localSimilarity(resume,job);
    const ai=await aiAssessment(resume,job,semantic);
    const experience=ai?.experience ?? Math.min(100,Math.round(localSimilarity(resume,"years experience senior lead manager professional work internship")));
    const education=ai?.education ?? Math.min(100,Math.round(localSimilarity(resume,"bachelor master degree computer science engineering education qualification")));
    const score=Math.round(semantic*.35+skillScore*.35+experience*.20+education*.10);
    return NextResponse.json({score,summary:ai?.summary||`The resume shares ${matched.length} of ${jobSkills.length||"the detected"} required skills with the role.`,matchedSkills:ai?.matchedSkills?.length?ai.matchedSkills:matched,missingSkills:ai?.missingSkills?.length?ai.missingSkills:missing,strengths:ai?.strengths?.length?ai.strengths:matched.slice(0,5).map(s=>`Relevant ${s} experience or knowledge detected`),gaps:ai?.gaps?.length?ai.gaps:missing.slice(0,5).map(s=>`${s} is requested but was not detected`),recommendation:ai?.recommendation||"Prioritize the missing skills most central to the role and make relevant evidence more explicit in the resume.",breakdown:{semantic,skills:skillScore,experience,education}});
  }catch(e){console.error(e);return NextResponse.json({error:e instanceof Error?e.message:"Unable to analyze resume."},{status:500});}
}