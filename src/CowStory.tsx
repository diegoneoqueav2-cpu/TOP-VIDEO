import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const Cow: React.FC<{ frame: number }> = ({ frame }) => {
  const bob = Math.sin(frame / 8) * 10;
  const blink = frame % 90 < 7 ? 0.18 : 1;
  return <div style={{ position:"absolute", left:"50%", top:"48%", width:470, height:330, transform:`translate(-50%,-50%) translateY(${bob}px)` }}>
    <div style={{ position:"absolute", left:80, top:55, width:310, height:210, borderRadius:"48% 48% 44% 44%", background:"#fffaf0", border:"8px solid #253b32", boxShadow:"0 22px 0 rgba(18,45,29,.12)" }}>
      <div style={{ position:"absolute", left:42, top:35, width:90, height:80, background:"#263b35", borderRadius:"45% 55% 50% 45%", transform:"rotate(-20deg)" }}/>
      <div style={{ position:"absolute", right:34, top:80, width:80, height:70, background:"#263b35", borderRadius:"50%" }}/>
      <div style={{ position:"absolute", left:-35, top:22, width:95, height:70, background:"#fffaf0", border:"7px solid #253b32", borderRadius:"80% 20% 80% 25%", transform:"rotate(-24deg)" }}/>
      <div style={{ position:"absolute", right:-35, top:22, width:95, height:70, background:"#fffaf0", border:"7px solid #253b32", borderRadius:"20% 80% 25% 80%", transform:"rotate(24deg)" }}/>
      <div style={{ position:"absolute", left:106, top:90, width:18, height:26, borderRadius:"50%", background:"#253b32", transform:`scaleY(${blink})` }}/>
      <div style={{ position:"absolute", right:106, top:90, width:18, height:26, borderRadius:"50%", background:"#253b32", transform:`scaleY(${blink})` }}/>
      <div style={{ position:"absolute", left:90, bottom:-35, width:130, height:82, borderRadius:"50%", background:"#f3a6a0", border:"7px solid #253b32" }}/>
      <div style={{ position:"absolute", left:126, bottom:-4, width:13, height:13, borderRadius:"50%", background:"#253b32" }}/>
      <div style={{ position:"absolute", left:174, bottom:-4, width:13, height:13, borderRadius:"50%", background:"#253b32" }}/>
    </div>
    {[0,1,2,3].map(i=><div key={i} style={{position:"absolute",left:130+i*55,top:250,width:25,height:85,background:"#fffaf0",border:"6px solid #253b32",borderRadius:12}}/>)}
    <div style={{position:"absolute",left:360,top:125,width:85,height:18,background:"#253b32",borderRadius:20,transform:"rotate(28deg)"}}/>
  </div>;
};

export const CowStory: React.FC = () => {
  const f = useCurrentFrame();
  const scene = (a:number,b:number) => interpolate(f,[a,a+12,b-12,b],[0,1,1,0],clamp);
  const pop = interpolate(f,[0,18,30],[0.7,1.06,1],{...clamp,easing:Easing.out(Easing.back(1.5))});
  const shake = f>190 && f<255 ? Math.sin(f*1.7)*8 : 0;
  const bubble = interpolate(f,[190,205,260],[0,1,1],clamp);
  const fart = interpolate(f,[205,235,280],[0,1,0],clamp);
  return <AbsoluteFill style={{background:"linear-gradient(180deg,#b9e9ff 0%,#e7f8df 58%,#77c96d 58%,#3d9b53 100%)",fontFamily:"Arial, sans-serif",overflow:"hidden"}}>
    <div style={{position:"absolute",top:120,left:0,right:0,textAlign:"center",fontSize:28,fontWeight:800,letterSpacing:7,color:"#286846"}}>UMA HISTÓRIA BEM CURTINHA</div>
    <div style={{position:"absolute",top:220,left:"10%",width:150,height:55,borderRadius:50,background:"rgba(255,255,255,.8)"}}/>
    <div style={{position:"absolute",top:250,right:"12%",width:190,height:62,borderRadius:50,background:"rgba(255,255,255,.8)"}}/>
    <div style={{position:"absolute",bottom:390,left:-80,width:1250,height:100,borderRadius:"50%",background:"#65b95e"}}/>
    <div style={{position:"absolute",bottom:330,left:0,right:0,textAlign:"center",opacity:scene(0,88),transform:`scale(${pop})`}}>
      <div style={{fontSize:72,fontWeight:900,color:"#174c32",textShadow:"0 4px #fff"}}>ERA UMA VEZ...</div>
    </div>
    <Cow frame={f}/>
    <div style={{position:"absolute",top:350,left:0,right:0,textAlign:"center",opacity:scene(65,175)}}>
      <div style={{display:"inline-block",padding:"22px 38px",background:"#fff",borderRadius:30,border:"5px solid #24563a",fontSize:58,fontWeight:900,color:"#24563a",boxShadow:"0 12px 0 rgba(28,76,48,.18)"}}>VACA VITÓRIA 🐮</div>
    </div>
    <div style={{position:"absolute",top:290,left:"58%",opacity:bubble,transform:`translateX(${shake}px) scale(${0.6+bubble*.4})`,background:"#fff",border:"5px solid #24563a",borderRadius:30,padding:"18px 25px",fontSize:34,fontWeight:900,color:"#24563a"}}>Prrrrt! 💨</div>
    <div style={{position:"absolute",left:"48%",top:"52%",fontSize:110,opacity:fart,transform:`translate(${fart*180}px,-${fart*35}px) rotate(-18deg) scale(${fart})`}}>💨</div>
    <div style={{position:"absolute",bottom:285,left:0,right:0,textAlign:"center",fontSize:64,fontWeight:900,color:"#fff",textShadow:"0 5px 0 #24563a",opacity:scene(175,275)}}>SOLTOU UM PEIDO!</div>
    <div style={{position:"absolute",bottom:300,left:0,right:0,textAlign:"center",fontSize:82,fontWeight:1000,color:"#fff",textShadow:"0 6px 0 #24563a",opacity:scene(270,360),transform:`scale(${interpolate(f,[270,292],[.5,1],clamp)})`}}>ACABOU A HISTÓRIA! 😂</div>
    <div style={{position:"absolute",bottom:130,left:0,right:0,textAlign:"center",fontSize:25,fontWeight:800,color:"#24563a",letterSpacing:4,opacity:interpolate(f,[330,360],[0,1],clamp)}}>FIM. 🐮</div>
  </AbsoluteFill>;
};
