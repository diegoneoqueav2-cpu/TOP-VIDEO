import React from "react";
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

const clamp={extrapolateLeft:"clamp" as const,extrapolateRight:"clamp" as const};
const ease=Easing.out(Easing.cubic);
const Green="#42c978", Dark="#10291f", Cream="#fff8e9";

const Presenter:React.FC<{compact?:boolean; talking?:boolean}> = ({compact=false,talking=true})=>{
 const f=useCurrentFrame(); const mouth=talking?(Math.sin(f*1.15)>0.15?8:0):0;
 return <div style={{width:compact?250:390,height:compact?350:540,position:"relative",transform:compact?"scale(.78)":"none",transformOrigin:"bottom center"}}>
  <svg viewBox="0 0 390 540" width="100%" height="100%" style={{overflow:"visible"}}>
   <ellipse cx="195" cy="515" rx="105" ry="15" fill="#07170f" opacity=".2"/>
   <path d="M100 505 Q95 410 125 355 L265 355 Q295 420 290 505Z" fill="#238d55" stroke={Dark} strokeWidth="9"/>
   <path d="M150 360 L195 420 L240 360" fill="#f4f0df" stroke={Dark} strokeWidth="7"/>
   <path d="M175 421 L195 449 L215 421" fill="none" stroke={Dark} strokeWidth="6"/>
   <path d="M125 385 Q65 390 48 455" fill="none" stroke={Dark} strokeWidth="23" strokeLinecap="round"/>
   <path d="M265 385 Q318 372 337 320" fill="none" stroke={Dark} strokeWidth="23" strokeLinecap="round"/>
   <circle cx="338" cy="313" r="17" fill="#d99a73" stroke={Dark} strokeWidth="7"/>
   <path d="M117 185 Q108 62 194 52 Q282 53 277 190 L267 302 Q240 358 195 360 Q142 353 120 300Z" fill="#4b3027" stroke={Dark} strokeWidth="9"/>
   <ellipse cx="195" cy="221" rx="102" ry="119" fill="#e8b18c" stroke={Dark} strokeWidth="9"/>
   <path d="M98 197 Q88 80 190 70 Q272 65 291 158 Q246 113 211 123 Q154 139 98 197Z" fill="#4b3027"/>
   <path d="M135 210 Q155 194 174 208 M216 208 Q239 192 256 209" fill="none" stroke={Dark} strokeWidth="9" strokeLinecap="round"/>
   <ellipse cx="158" cy="229" rx="9" ry="14" fill={Dark}/><ellipse cx="235" cy="229" rx="9" ry="14" fill={Dark}/>
   <circle cx="161" cy="224" r="3" fill="white"/><circle cx="238" cy="224" r="3" fill="white"/>
   <path d={`M169 283 Q195 ${292+mouth} 221 283`} stroke={Dark} strokeWidth="8" fill="none" strokeLinecap="round"/>
   <path d="M185 264 Q195 271 205 264" fill="none" stroke="#b97860" strokeWidth="5"/>
   <circle cx="125" cy="260" r="13" fill="#e98e7f" opacity=".55"/><circle cx="263" cy="260" r="13" fill="#e98e7f" opacity=".55"/>
  </svg>
 </div>
};

const Camera:React.FC<{scale?:number; led?:boolean}> = ({scale=1,led=true})=><div style={{transform:`scale(${scale})`,transformOrigin:"center",width:220,height:125,position:"relative"}}>
 <div style={{position:"absolute",left:25,top:18,width:155,height:78,borderRadius:"25px 18px 18px 25px",background:"linear-gradient(145deg,#f5f7f4,#9ba9a2)",border:"8px solid #263b32",boxShadow:"0 13px 22px #06150d55"}}/>
 <div style={{position:"absolute",left:130,top:32,width:57,height:48,borderRadius:18,background:"#263b32",border:"6px solid #d5ded8"}}/>
 <div style={{position:"absolute",left:143,top:43,width:30,height:27,borderRadius:"50%",background:"#142b38",border:"5px solid #66818a"}}/>
 <div style={{position:"absolute",left:153,top:49,width:10,height:10,borderRadius:"50%",background:led?"#ff4d4d":"#243b32",boxShadow:led?"0 0 17px #ff3737": "none"}}/>
 <div style={{position:"absolute",left:75,top:88,width:48,height:25,background:"#35483f",clipPath:"polygon(20% 0,80% 0,100% 100%,0 100%)"}}/>
 <div style={{position:"absolute",left:83,top:106,width:34,height:8,borderRadius:8,background:"#263b32"}}/>
 </div>;

const Burglar:React.FC<{scared?:boolean; sleeping?:boolean}> = ({scared=false,sleeping=false})=><div style={{width:270,height:390,position:"relative"}}>
 <svg viewBox="0 0 270 390" width="100%" height="100%">
  <ellipse cx="135" cy="374" rx="95" ry="12" fill="#09180f" opacity=".18"/>
  <path d="M60 365 Q58 255 86 220 L190 220 Q217 270 211 365Z" fill="#334c48" stroke="#14251e" strokeWidth="9"/>
  <path d="M90 236 L135 290 L183 236" fill="#e5e6db"/>
  <path d="M92 355 L85 378 M184 355 L194 378" stroke="#182b25" strokeWidth="22" strokeLinecap="round"/>
  <ellipse cx="137" cy="151" rx="78" ry="88" fill="#d99a73" stroke="#14251e" strokeWidth="9"/>
  <path d="M59 135 Q48 65 132 59 Q215 55 216 139 Q183 104 136 112 Q94 119 59 135Z" fill="#242c2b"/>
  <path d={scared?"M88 137 Q109 118 128 137 M151 137 Q171 117 190 138":"M91 143 Q110 135 127 144 M151 144 Q170 135 190 143"} stroke="#14251e" strokeWidth="8" fill="none" strokeLinecap="round"/>
  <ellipse cx="109" cy="158" rx="9" ry={scared?17:8} fill="#14251e"/><ellipse cx="171" cy="158" rx="9" ry={scared?17:8} fill="#14251e"/>
  <path d={scared?"M119 204 Q137 180 155 204 Q137 229 119 204Z":"M119 204 Q137 212 155 204"} fill={scared?"#48251f":"none"} stroke="#14251e" strokeWidth="7"/>
  <path d="M65 265 Q20 244 30 193 M205 265 Q244 240 232 194" stroke="#14251e" strokeWidth="20" strokeLinecap="round" fill="none"/>
 </svg>
 {scared&&<div style={{position:"absolute",top:15,right:0,fontSize:52}}>😱</div>}
 {sleeping&&<div style={{position:"absolute",top:-5,right:0,fontSize:48,color:"#fff",fontWeight:900}}>Zzz</div>}
 </div>;

const Store:React.FC<{night?:boolean}>=({night=true})=><AbsoluteFill style={{background:night?"linear-gradient(180deg,#101d2c,#273c45 58%,#15291e 58%)":"linear-gradient(180deg,#d5f0e0,#8dc49b)"}}>
 <div style={{position:"absolute",top:90,left:60,right:60,height:16,background:"#e8d9ae",borderRadius:10}}/>
 <div style={{position:"absolute",top:106,left:75,right:75,height:9,background:"#ffda8a",boxShadow:"0 0 35px #ffca6c"}}/>
 <div style={{position:"absolute",left:55,top:250,width:320,height:500,background:"#dbe8e0",border:"12px solid #263a32",borderRadius:18,boxShadow:"inset 0 0 35px #9fb8aa"}}>
  <div style={{position:"absolute",top:20,left:0,right:0,height:10,background:"#263a32"}}/>
  {[0,1,2].map(i=><div key={i} style={{position:"absolute",top:95+i*115,left:15,right:15,height:5,background:"#80988c"}}/>)}
  {["🧁","🥤","🍰","🥛","🍮","🍫"].map((x,i)=><div key={i} style={{position:"absolute",left:25+(i%2)*130,top:35+Math.floor(i/2)*115,fontSize:48}}>{x}</div>)}
  <div style={{position:"absolute",right:15,top:25,bottom:25,width:8,background:"#a8bdb2"}}/>
 </div>
 <div style={{position:"absolute",right:45,top:410,width:420,height:220,background:"#ad7950",border:"12px solid #493529",borderRadius:12,boxShadow:"0 18px 0 #65452f"}}/>
 <div style={{position:"absolute",right:70,top:345,width:360,height:70,background:"#d3a06d",border:"10px solid #493529",borderRadius:10}}/>
 <div style={{position:"absolute",right:85,top:265}}><Camera scale={.72}/></div>
 <div style={{position:"absolute",left:40,top:45,fontSize:24,fontWeight:900,color:night?"#dcefe3":"#244d36",letterSpacing:4}}>LOJA • MONITORAMENTO 24H</div>
 </AbsoluteFill>;

const ScenePanel:React.FC<{title:string;sub:string;children:React.ReactNode;presenter:boolean}> = ({title,sub,children,presenter})=>{
 const f=useCurrentFrame(); const {fps}=useVideoConfig();
 const enter=spring({frame:f,fps,config:{damping:16,stiffness:90}});
 return <AbsoluteFill style={{overflow:"hidden",background:"#10291f"}}>
  <div style={{position:"absolute",inset:0,transform:`scale(${1.04+enter*.035}) translateX(${interpolate(f,[0,18],[35,0],clamp)}px)`}}>{children}</div>
  <div style={{position:"absolute",top:68,left:54,right:54,display:"flex",alignItems:"center",gap:15}}>
   <div style={{width:13,height:48,background:Green,borderRadius:12}}/>
   <div style={{fontSize:25,fontWeight:900,letterSpacing:3,color:"white"}}>CÂMERA FOFOQUEIRA</div>
  </div>
  <div style={{position:"absolute",bottom:80,left:45,right:45,padding:"22px 25px",background:"rgba(9,29,20,.88)",border:"2px solid rgba(255,255,255,.25)",borderRadius:25,transform:`translateY(${interpolate(f,[0,12],[55,0],clamp)}px)`}}>
   <div style={{fontSize:35,fontWeight:950,color:"#9af0b8",lineHeight:1.1}}>{title}</div>
   <div style={{fontSize:25,fontWeight:650,color:"white",marginTop:9}}>{sub}</div>
  </div>
  {presenter&&<div style={{position:"absolute",right:-5,bottom:300,width:185,height:260,background:"#f7f3e8",border:"5px solid #fff",borderRadius:26,overflow:"hidden",boxShadow:"0 12px 30px #0007"}}><Presenter compact/></div>}
 </AbsoluteFill>
};

export const CameraFofoqueira:React.FC=()=>{
 const f=useCurrentFrame(); const {fps}=useVideoConfig();
 const intro=spring({frame:f,fps,config:{damping:13,stiffness:80}});
 const cut=(start:number,end:number)=>interpolate(f,[start,start+10,end-10,end],[0,1,1,0],clamp);
 const shake=f>330&&f<385?Math.sin(f*1.7)*9:0;
 return <AbsoluteFill style={{background:Dark,fontFamily:"Arial, Helvetica, sans-serif",overflow:"hidden"}}>
  <Audio src={staticFile("audio/camera-fofoqueira.wav")} volume={1}/>
  <Sequence from={0} durationInFrames={135}>
   <AbsoluteFill style={{background:"radial-gradient(circle at 50% 30%,#315d43,#10291f 75%)"}}>
    <div style={{position:"absolute",top:85,left:0,right:0,textAlign:"center",fontSize:25,fontWeight:900,letterSpacing:7,color:"#a7efbd"}}>UMA HISTÓRIA QUE ACONTECE TODO DIA...</div>
    <div style={{position:"absolute",top:170,left:0,right:0,textAlign:"center",fontSize:72,fontWeight:1000,color:"white",transform:`scale(${.8+intro*.2})`}}>CÂMERA<br/><span style={{color:Green}}>FOFOQUEIRA?</span></div>
    <div style={{position:"absolute",bottom:30,left:"50%",transform:"translateX(-50%)"}}><Presenter/></div>
    <div style={{position:"absolute",right:70,top:330,transform:`rotate(-12deg) scale(${.7+intro*.3})`}}><Camera scale={.9}/></div>
   </AbsoluteFill>
  </Sequence>
  <Sequence from={125} durationInFrames={185}>
   <ScenePanel title="OLHA QUEM CHEGOU..." sub="O sujeito entra achando que ninguém está vendo." presenter>
    <Store/>
    <div style={{position:"absolute",left:420,top:380,transform:`translateX(${interpolate(f,[125,185],[120,0],clamp)}px) scale(${1+cut(125,310)*.08})`}}><Burglar/></div>
    <div style={{position:"absolute",right:65,top:250,transform:`scale(${.8+cut(190,245)*.3}) rotate(-8deg)`}}><Camera/></div>
    <div style={{position:"absolute",right:80,top:170,fontSize:45,color:"#ffdb75",fontWeight:1000,opacity:cut(205,255)}}>BIP!</div>
   </ScenePanel>
  </Sequence>
  <Sequence from={300} durationInFrames={190}>
   <ScenePanel title="NEM UM BOLINHO!" sub="Ele abre a geladeira... e dá de cara com outra câmera." presenter>
    <Store/>
    <div style={{position:"absolute",left:300,top:380,transform:`translateX(${shake}px) rotate(${interpolate(f,[300,350],[0,-5],clamp)}deg)`}}><Burglar scared/></div>
    <div style={{position:"absolute",left:80,top:230,transform:`scale(${1+cut(330,380)*.22})`}}><Camera/></div>
    <div style={{position:"absolute",left:100,top:170,fontSize:46,fontWeight:1000,color:"#ffdf82",opacity:cut(335,390)}}>EI! 👀</div>
    <div style={{position:"absolute",right:80,top:240,fontSize:75,transform:`scale(${cut(360,405)})`}}>🧁</div>
   </ScenePanel>
  </Sequence>
  <Sequence from={480} durationInFrames={190}>
   <ScenePanel title="E O FUNCIONÁRIO?" sub="Será que o patrão viu ele dormindo no balcão?" presenter>
    <Store night={false}/>
    <div style={{position:"absolute",right:220,top:390,transform:`rotate(${Math.sin(f/10)*2}deg)`}}><Burglar sleeping/></div>
    <div style={{position:"absolute",right:55,top:240,transform:`rotate(${Math.sin(f/12)*8}deg)`}}><Camera/></div>
    <div style={{position:"absolute",left:80,top:230,fontSize:55,fontWeight:1000,color:"#fff",textShadow:"0 3px 10px #000"}}>Zzz...</div>
   </ScenePanel>
  </Sequence>
  <Sequence from={660} durationInFrames={150}>
   <AbsoluteFill style={{background:"radial-gradient(circle at 50% 35%,#39794f,#10291f 75%)"}}>
    <div style={{position:"absolute",top:65,left:0,right:0,textAlign:"center",fontSize:27,fontWeight:900,letterSpacing:5,color:"#b9f5c9"}}>ELA VÊ TUDO. E NÃO CONTA PRA NINGUÉM...</div>
    <div style={{position:"absolute",top:140,left:0,right:0,textAlign:"center",transform:`translateY(${shake}px)`}}><Camera scale={1.55}/></div>
    <div style={{position:"absolute",top:410,left:0,right:0,textAlign:"center",fontSize:76,fontWeight:1000,color:"white",lineHeight:1}}>CÂMERA<br/><span style={{color:Green}}>FOFOQUEIRA!</span></div>
    <div style={{position:"absolute",bottom:80,left:0,right:0,textAlign:"center",fontSize:34,fontWeight:800,color:"#fff"}}>Proteja sua loja. Monitore cada detalhe.</div>
    <div style={{position:"absolute",bottom:25,left:0,right:0,textAlign:"center",fontSize:18,fontWeight:800,color:"#a8efbd",letterSpacing:4}}>SEGURANÇA 24 HORAS</div>
   </AbsoluteFill>
  </Sequence>
 </AbsoluteFill>
};

// Cena promocional renderizada em 9:16 com personagem narradora e cortes animados.
