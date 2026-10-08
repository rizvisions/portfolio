"""Compose the original 64-bar Terminal campaign score (no sampled music)."""
import numpy as np, wave, subprocess
from pathlib import Path
RATE=22050; BPM=88; BEAT=60/BPM; BAR=4*BEAT; DURATION=64*BAR+4
track=np.zeros((int(DURATION*RATE),2),np.float32);rng=np.random.default_rng(1983)
def note(midi):return 440*2**((midi-69)/12)
def add(at,duration,midi,gain=.1,voice='pad',pan=0):
 n=int(duration*RATE);t=np.arange(n)/RATE;f=note(midi)
 if voice=='pad':
  signal=(np.sin(2*np.pi*f*t)+.34*np.sin(2*np.pi*f*1.002*t)+.18*np.sin(2*np.pi*f*2*t))*.6
  env=np.minimum(1,t/.5)*np.minimum(1,(duration-t)/.9)
 elif voice=='bass':
  signal=np.sin(2*np.pi*f*t)+.28*np.sin(2*np.pi*f*2*t)+.1*np.sin(2*np.pi*f*3*t)
  env=np.minimum(1,t/.012)*np.exp(-t/max(.2,duration*.65))
 elif voice=='lead':
  signal=np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2.001*t)+.1*np.sin(2*np.pi*f*3*t)
  env=np.minimum(1,t/.04)*np.minimum(1,(duration-t)/.25)
 else:
  signal=np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*f*2*t);env=np.minimum(1,t/.006)*np.exp(-t/.21)
 signal=signal*env*gain
 start=int(at*RATE);end=min(len(track),start+n);n=end-start
 if n<=0:return
 track[start:end,0]+=signal[:n]*np.sqrt((1-pan)/2);track[start:end,1]+=signal[:n]*np.sqrt((1+pan)/2)
 if voice=='lead':
  for repeat in [1,2,3]:
   offset=start+int(BEAT*.75*repeat*RATE);lim=min(len(track),offset+n);count=lim-offset
   if count>0:track[offset:lim,repeat%2]+=signal[:count]*(.28**repeat)
def drum(at,kind,gain):
 duration=.4 if kind=='snare' else .25;t=np.arange(int(duration*RATE))/RATE
 if kind=='kick':signal=np.sin(2*np.pi*(45*t+12*(1-np.exp(-t*30))/30))*np.exp(-t*18)
 elif kind=='snare':signal=(rng.normal(0,.28,len(t))+np.sin(2*np.pi*165*t)*.15)*np.exp(-t*15)
 else:signal=rng.normal(0,.12,len(t))*np.exp(-t*55)
 start=int(at*RATE);end=min(start+len(t),len(track));track[start:end,:]+=signal[:end-start,None]*gain
# Intro / first theme / suspended bridge / developed theme / climax / coda.
chords=[(38,[50,53,57]),(34,[46,50,53]),(41,[53,57,60]),(36,[48,52,55]),(31,[43,46,50]),(39,[51,55,58]),(33,[45,50,52]),(38,[50,53,57])]
phrases=[[(0,74,1.4),(1.75,72,.65),(2.75,69,.9)],[(.5,65,1.1),(2,67,.65),(3,69,.75)],[(0,72,1.5),(2.25,74,.6),(3,77,.7)],[(.5,76,.7),(1.5,72,.7),(2.5,69,1.2)],[(0,67,1.5),(2,70,.9)],[(.5,75,1.1),(2.25,72,1.2)],[(0,69,.6),(1,74,1),(2.75,76,.6)],[(.5,74,2.4)]]
for bar in range(64):
 at=bar*BAR;section=0 if bar<8 else 1 if bar<24 else 2 if bar<32 else 3 if bar<48 else 4 if bar<56 else 5
 chordindex=(bar//2)%8 if section!=2 else [4,5,6,0][(bar-24)//2]
 root,chord=chords[chordindex]
 intensity=[.55,.8,.45,.9,1,.5][section]
 if bar%2==0:
  for index,midi in enumerate(chord):add(at,2*BAR+.7,midi,.052*intensity,'pad',(index-1)*.5)
 if section in [1,3,4]:
  for beat in [0,1.5,2,3.5]:add(at+beat*BEAT,.55*BEAT,root+(12 if beat==3.5 else 0),.17*intensity,'bass')
  for beat in [0,2]:drum(at+beat*BEAT,'kick',.16*intensity)
  for beat in [1,3]:drum(at+beat*BEAT,'snare',.10*intensity)
  for beat in np.arange(.5,4,1 if section==1 else .5):drum(at+beat*BEAT,'hat',.12*intensity)
 elif bar%2==0:add(at,BAR,root,.08,'bass')
 if section in [1,3,4] and bar%4!=3:
  phrase=phrases[(bar+(4 if section==3 else 0))%8]
  for beat,midi,duration in phrase:add(at+beat*BEAT,duration*BEAT,midi+(12 if section==4 and bar%4==2 else 0),.075*intensity,'lead',.2)
 if section==2 and bar%2==1:
  add(at+BEAT,2*BEAT,chord[-1]+12,.055,'lead',-.3)
 if section in [0,3,4] and bar%4 in [1,2]:
  for step in range(8):add(at+step*.5*BEAT,.45*BEAT,chord[(step+bar)%3]+12,.024,'pluck',(-1 if step%2 else 1)*.45)
# A resolved coda, followed by a short quiet gap before the score repeats.
for m in [50,53,57,62]:add(62*BAR,2*BAR,m,.045,'pad')
fadein=np.minimum(1,np.arange(len(track))/(RATE*3));fadeout=np.minimum(1,(len(track)-np.arange(len(track)))/(RATE*5));track*= (fadein*fadeout)[:,None]
peak=np.max(np.abs(track));track=np.tanh(track/max(.01,peak)*1.2)*.6
root=Path(__file__).resolve().parents[1];out=root/'assets/music';out.mkdir(parents=True,exist_ok=True)
wavepath=Path('/tmp/war-score.wav')
with wave.open(str(wavepath),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes((track*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wavepath),'-codec:a','libmp3lame','-b:a','48k',str(out/'wopr-night-watch.mp3')],check=True)
print(f'Night Watch: {DURATION:.1f}s, 64 bars at {BPM} BPM')
