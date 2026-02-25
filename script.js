
const panelsDiv = document.getElementById('panels');
const generateBtn = document.getElementById('generateBtn');
const storyInput = document.getElementById('storyInput');

const dummyImages = [
  'assets/panel1.png','assets/panel2.png','assets/panel3.png','assets/panel4.png','assets/panel5.png',
  'assets/panel6.png','assets/panel7.png','assets/panel8.png','assets/panel9.png','assets/panel10.png'
];

function splitStory(story,count){
    let lines = story.split(/\n+/).filter(l=>l.trim()!=="");
    let panels = [];
    for(let i=0;i<count;i++){
        let text = lines[i] || lines[lines.length-1] || "Panel " + (i+1);
        panels.push(text.trim());
    }
    return panels;
}

async function generateEpisode(){
    const story = storyInput.value.trim();
    const count = parseInt(document.getElementById('panelCount').value);
    if(!story) return alert("Tulis cerita dulu!");
    panelsDiv.innerHTML='';
    const panelTexts = splitStory(story,count);

    for(let i=0;i<count;i++){
        const text = panelTexts[i];
        const panelDiv = document.createElement('div');
        panelDiv.className='panel';
        panelDiv.innerHTML = `<img src="assets/loading.png"><p>${text}</p>`;
        panelsDiv.appendChild(panelDiv);

        try {
            const payload = {
                prompt: `${text} in Naruto style, manhwa/manga, vibrant colors, dramatic lighting`,
                steps: 25,
                width: 512,
                height: 768
            };
            const res = await fetch("https://stablehorde.net/api/v2/generate/async", {
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            const jobId = data.id;

            let finished=false;
            while(!finished){
                await new Promise(r=>setTimeout(r,1000));
                const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`);
                const statusData = await statusRes.json();
                if(statusData.done && statusData.generations && statusData.generations.length>0){
                    finished = true;
                    const imgBase64 = "data:image/png;base64," + statusData.generations[0].img;
                    panelDiv.querySelector('img').src = imgBase64;
                }
            }
        } catch(err){
            panelDiv.querySelector('img').src = dummyImages[i % dummyImages.length];
        }
    }
}

function downloadAllPanels(){
    const images=document.querySelectorAll('#panels img');
    images.forEach((img,idx)=>{
        const link=document.createElement('a');
        link.href=img.src;
        link.download='panel_'+(idx+1)+'.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

async function downloadPDF(){
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    const images=document.querySelectorAll('#panels img');
    let yOffset=20;

    for(let i=0;i<images.length;i++){
        const img=images[i];
        await new Promise(res=>{
            const image=new Image();
            image.crossOrigin="anonymous";
            image.onload=function(){
                const ratio=image.width/image.height;
                const width=500;
                const height=width/ratio;
                if(yOffset+height>pdf.internal.pageSize.getHeight()){
                    pdf.addPage();
                    yOffset=20;
                }
                pdf.addImage(image,'PNG',50,yOffset,width,height);
                yOffset+=height+30;
                res();
            }
            image.src=img.src;
        });
    }
    pdf.save('webtoon_episode.pdf');
}

generateBtn.onclick = generateEpisode;
document.getElementById('downloadPNG').onclick = downloadAllPanels;
document.getElementById('downloadPDF').onclick = downloadPDF;
