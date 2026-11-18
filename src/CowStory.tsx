import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// A personagem é desenhada uma única vez e reutilizada durante as três cenas.
const Cow: React.FC<{ frame: number }> = ({ frame }) => {
  const walk = interpolate(frame, [0, 165, 190], [0, 1, 1], clamp);
  const bob = Math.sin(frame / 5) * 5 * walk;
  const step = Math.sin(frame / 3.2) * 18 * (frame < 165 ? 1 : 0);
  const blink = frame % 104 < 7 ? 0.12 : 1;
  const x = interpolate(frame, [0, 165], [-110, 90], clamp);
  return <div style={{position:"absolute",left:"50%",top:"48%",width:500,height:370,transform:`translate(calc(-50% + ${x}px),-50%) translateY(${bob}px)`}}>
    <div style={{position:"absolute",left:75,top:55,width:335,height:220,borderRadius:"48% 48% 44% 44%",background:"#fffaf0",border:"8px solid #263b35",boxShadow:"0 20px 0 rgba(18,45,29,.12)"}}>
      <div style={{position:"absolute",left:42,top:35,width:100,height:90,background:"#263b35",borderRadius:"45% 55% 50% 45%",transform:"rotate(-20deg)"}}/>
      <div style={{position:"absolute",right:35,top:82,width:88,height:78,background:"#263b35",borderRadius:"50%"}}/>
      <div style={{position:"absolute",left:-35,top:15,width:100,height:75,background:"#fffaf0",border:"7px solid #263b35",borderRadius:"80% 20% 80% 25%",transform:"rotate(-24deg)"}}/>
      <div style={{position:"absolute",right:-35,top:15,width:100,height:75,background:"#fffaf0",border:"7px solid #263b35",borderRadius:"20% 80% 25% 80%",transform:"rotate(24deg)"}}/>
      <div style={{position:"absolute",left:116,top:94,width:18,height:27,borderRadius:"50%",background:"#263b35",transform:`scaleY(${blink})`}}/>
      <div style={{position:"absolute",right:116,top:94,width:18,height:27,borderRadius:"50%",background:"#263b35",transform:`scaleY(${blink})`}}/>
      <div style={{position:"absolute",left:94,bottom:-36,width:145,height:86,borderRadius:"50%",background:"#f3a6a0",border:"7px solid #263b35"}}/>
      <div style={{position:"absolute",left:134,bottom:-5,width:14,height:14,borderRadius:"50%",background:"#263b35"}}/>
      <div style={{position:"absolute",left:185,bottom:-5,width:14,height:14,borderRadius:"50%",background:"#263b35"}}/>
    </div>
    {[0,1,2,3].map((i)=><div key={i} style={{position:"absolute",left:125+i*62,top:260,width:27,height:91,background:"#fffaf0",border:"6px solid #263b35",borderRadius:12,transform:`rotate(${i%2===0?step:-step}deg)`,transformOrigin:"top center"}}/>)}
    <div style={{position:"absolute",left:390,top:140,width:92,height:18,background:"#263b35",borderRadius:20,transform:`rotate(${28+Math.sin(frame/6)*12}deg)`}}/>
  </div>;
};

export const CowStory: React.FC = () => {
  const f = useCurrentFrame();
  const scene = (a:number,b:number) => interpolate(f,[a,a+12,b-12,b],[0,1,1,0],clamp);
  const pop = interpolate(f,[0,18,30],[0.7,1.06,1],{...clamp,easing:Easing.out(Easing.back(1.5))});
  const shake = f>190 && f<255 ? Math.sin(f*1.7)*9 : 0;
  const blast = interpolate(f,[202,211,229,255],[0,1,1,0],clamp);
  const endScale = interpolate(f,[270,292],[.5,1],clamp);
  return <AbsoluteFill style={{background:"linear-gradient(180deg,#b9e9ff 0%,#e7f8df 58%,#77c96d 58%,#3d9b53 100%)",fontFamily:"Arial, sans-serif",overflow:"hidden"}}>
    <Audio src={staticFile("audio/vaca-vitoria-narracao.wav")} volume={1}/>
    <Audio src={staticFile("audio/vaca-vitoria-musica.wav")} volume={0.22}/>
    <div style={{position:"absolute",top:120,left:0,right:0,textAlign:"center",fontSize:28,fontWeight:800,letterSpacing:7,color:"#286846"}}>UMA HISTÓRIA BEM CURTINHA</div>
    <div style={{position:"absolute",top:220,left:"10%",width:150,height:55,borderRadius:50,background:"rgba(255,255,255,.8)"}}/>
    <div style={{position:"absolute",top:250,right:"12%",width:190,height:62,borderRadius:50,background:"rgba(255,255,255,.8)"}}/>
    <div style={{position:"absolute",bottom:390,left:-80,width:1250,height:100,borderRadius:"50%",background:"#65b95e"}}/>
    <div style={{position:"absolute",bottom:330,left:0,right:0,textAlign:"center",opacity:scene(0,88),transform:`scale(${pop})`}}>
      <div style={{fontSize:72,fontWeight:900,color:"#174c32",textShadow:"0 4px #fff"}}>ERA UMA VEZ...</div>
    </div>
    <Cow frame={f}/>
    <div style={{position:"absolute",top:350,left:0,right:0,textAlign:"center",opacity:scene(65,175),transform:`translateX(${shake}px)`}}>
      <div style={{display:"inline-block",padding:"22px 38px",background:"#fff",borderRadius:30,border:"5px solid #24563a",fontSize:58,fontWeight:900,color:"#24563a",boxShadow:"0 12px 0 rgba(28,76,48,.18)"}}>VACA VITÓRIA 🐮</div>
    </div>
    <div style={{position:"absolute",top:285,left:"58%",opacity:blast,transform:`translateX(${shake}px) scale(${.6+blast*.4})`,background:"#fff",border:"5px solid #24563a",borderRadius:30,padding:"18px 25px",fontSize:34,fontWeight:900,color:"#24563a"}}>PRRRRT! 💨</div>
    <div style={{position:"absolute",left:"43%",top:"45%",fontSize:190,opacity:blast,transform:`translate(${blast*80}px,-${blast*55}px) rotate(-18deg) scale(${blast})`,filter:"drop-shadow(0 8px 0 rgba(255,255,255,.7))"}}>💥</div>
    <div style={{position:"absolute",left:"48%",top:"57%",fontSize:115,opacity:blast,transform:`translateX(${blast*125}px) scale(${blast})`}}>💨</div>
    <div style={{position:"absolute",bottom:285,left:0,right:0,textAlign:"center",fontSize:64,fontWeight:900,color:"#fff",textShadow:"0 5px 0 #24563a",opacity:scene(175,275)}}>SOLTOU UM PEIDO!</div>
    <div style={{position:"absolute",bottom:300,left:0,right:0,textAlign:"center",fontSize:82,fontWeight:1000,color:"#fff",textShadow:"0 6px 0 #24563a",opacity:scene(270,360),transform:`scale(${endScale})`}}>ACABOU A HISTÓRIA! 😂</div>
    <div style={{position:"absolute",bottom:130,left:0,right:0,textAlign:"center",fontSize:25,fontWeight:800,color:"#24563a",letterSpacing:4,opacity:interpolate(f,[330,360],[0,1],clamp)}}>FIM. 🐮</div>
  </AbsoluteFill>;
};
