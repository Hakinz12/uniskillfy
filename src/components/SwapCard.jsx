import { useRef, useState } from 'react';
import { initials } from '../data.js';
import { useToast, SwapIcon } from './ui.jsx';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const PURPLE = '#5b3df5';
const CORAL = '#ff6b4a';

function visibleSkills(skills) {
  const shown = skills.slice(0, 4);
  if (skills.length > shown.length) shown.push(`+${skills.length - shown.length} more`);
  return shown;
}

export function buildShareText(profile, url = window.location.href) {
  return `I teach ${profile.teaches.join(' and ')}. I want to learn ${profile.wants.join(' and ')}. Swap skills with me on Campus Skill Swap: ${url}`;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  let lines = wrapText(ctx, text, maxWidth);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, '')}…`;
  }
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawSkillPills(ctx, skills, x, y, maxWidth) {
  ctx.font = '700 25px "DM Sans", sans-serif';
  let rowX = x;
  let rowY = y;
  let rowHeight = 0;
  visibleSkills(skills).forEach(skill => {
    const lines = wrapText(ctx, skill, maxWidth - 36);
    const pillWidth = Math.min(maxWidth, Math.max(105, ...lines.map(line => ctx.measureText(line).width + 36)));
    const pillHeight = lines.length * 32 + 22;
    if (rowX !== x && rowX + pillWidth > x + maxWidth) {
      rowX = x;
      rowY += rowHeight + 14;
      rowHeight = 0;
    }
    ctx.fillStyle = '#f2eefc';
    roundedRect(ctx, rowX, rowY, pillWidth, pillHeight, 18);
    ctx.fill();
    ctx.fillStyle = PURPLE;
    lines.forEach((line, index) => ctx.fillText(line, rowX + 18, rowY + 36 + index * 32));
    rowX += pillWidth + 14;
    rowHeight = Math.max(rowHeight, pillHeight);
  });
  return rowY + rowHeight;
}

function drawCard(ctx, profile) {
  const background = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, PURPLE);
  background.addColorStop(1, '#3921a7');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = CORAL;
  ctx.beginPath();
  ctx.arc(1010, 130, 270, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(820, 175);
  ctx.lineTo(970, 175);
  ctx.lineTo(930, 135);
  ctx.moveTo(970, 175);
  ctx.lineTo(930, 215);
  ctx.moveTo(1000, 230);
  ctx.lineTo(850, 230);
  ctx.lineTo(890, 190);
  ctx.moveTo(850, 230);
  ctx.lineTo(890, 270);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#fff';
  ctx.font = '800 34px "Bricolage Grotesque", sans-serif';
  ctx.fillText('SwapSkill', 72, 112);
  ctx.font = '500 19px "DM Sans", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.82)';
  ctx.fillText('CAMPUS SKILL EXCHANGE', 74, 148);

  ctx.fillStyle = '#fff';
  roundedRect(ctx, 60, 220, 960, 1010, 34);
  ctx.fill();
  ctx.fillStyle = CORAL;
  ctx.beginPath();
  ctx.arc(154, 345, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '800 36px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(initials(profile.name), 154, 358);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#24165f';
  ctx.font = '800 59px "Bricolage Grotesque", sans-serif';
  let y = drawWrappedText(ctx, profile.name, 120, 470, 840, 70);
  ctx.fillStyle = '#62607a';
  ctx.font = '500 29px "DM Sans", sans-serif';
  y = drawWrappedText(ctx, profile.college, 122, y + 6, 820, 40);

  y += 34;
  ctx.strokeStyle = '#e6e2f2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, y);
  ctx.lineTo(960, y);
  ctx.stroke();

  y += 62;
  ctx.fillStyle = CORAL;
  ctx.font = '800 24px "DM Sans", sans-serif';
  ctx.fillText('I TEACH', 122, y);
  y = drawSkillPills(ctx, profile.teaches, 122, y + 24, 836) + 52;

  ctx.fillStyle = PURPLE;
  ctx.font = '800 24px "DM Sans", sans-serif';
  ctx.fillText('I WANT TO LEARN', 122, y);
  y = drawSkillPills(ctx, profile.wants, 122, y + 24, 836);

  ctx.fillStyle = PURPLE;
  roundedRect(ctx, 122, 1125, 836, 66, 22);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 24px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Teach what you know. Learn what you love.', 540, 1167);
  ctx.textAlign = 'left';
}

async function createCardImage(profile) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available in this browser.');
  drawCard(context, profile);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The image could not be created.');
  return new File([blob], 'swap-card.png', { type: 'image/png' });
}

async function copyText(text) {
  let clipboardError;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      clipboardError = error;
    }
  }

  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand?.('copy');
  input.remove();
  if (!copied) throw clipboardError || new Error('Clipboard access is unavailable.');
}

export default function SwapCard({ profile }) {
  const dialogRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  async function downloadImage() {
    setGenerating(true);
    try {
      const file = await createCardImage(profile);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Your swap card image is downloading.');
    } catch (error) {
      toast(error instanceof Error ? `Could not create image: ${error.message}` : 'Could not create image.');
    } finally {
      setGenerating(false);
    }
  }

  async function share() {
    setGenerating(true);
    try {
      const file = await createCardImage(profile);
      const text = buildShareText(profile);
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'My SwapSkill card', text });
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      await copyText(text);
      toast('Swap message copied to the clipboard.');
    } catch (error) {
      toast(error instanceof Error ? `Could not share: ${error.message}` : 'Could not share your swap card.');
    } finally {
      setGenerating(false);
    }
  }

  const busyContent = generating && <><span className="spinner" aria-hidden="true" />Generating image...</>;

  return (
    <>
      <button className="btn ghost small" type="button" onClick={() => dialogRef.current?.showModal()}>
        Share my swap card
      </button>
      <dialog className="swap-dialog" ref={dialogRef} aria-labelledby="swapCardTitle" onClick={e => {
        if (e.target === dialogRef.current) dialogRef.current.close();
      }}>
        <div className="dlg-body swap-dialog-body">
          <h3 id="swapCardTitle">Your SwapSkill card</h3>
          <article className="swap-share-card" aria-label={`${profile.name}'s swap card`}>
            <header className="swap-share-brand">
              <strong>SwapSkill</strong>
              <span>Campus skill exchange</span>
            </header>
            <div className="swap-share-arrows" aria-hidden="true"><SwapIcon size={34} /></div>
            <div className="swap-share-person">
              <span className="swap-share-avatar" aria-hidden="true">{initials(profile.name)}</span>
              <div><h4>{profile.name}</h4><p>{profile.college}</p></div>
            </div>
            <div className="swap-share-skills">
              <section>
                <h5>I teach</h5>
                <ul>{visibleSkills(profile.teaches).map(skill => <li key={skill}>{skill}</li>)}</ul>
              </section>
              <section>
                <h5>I want to learn</h5>
                <ul>{visibleSkills(profile.wants).map(skill => <li key={skill}>{skill}</li>)}</ul>
              </section>
            </div>
            <p className="swap-share-tagline">Teach what you know. Learn what you love.</p>
          </article>
          <div className="form-actions swap-share-actions">
            <button className="btn primary" type="button" autoFocus disabled={generating} onClick={downloadImage}>{busyContent || 'Download image'}</button>
            <button className="btn ghost" type="button" disabled={generating} onClick={share}>{busyContent || 'Share'}</button>
            <button className="btn ghost" type="button" onClick={() => dialogRef.current.close()}>Close</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
