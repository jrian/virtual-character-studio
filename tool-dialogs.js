(()=>{
'use strict';
const triggers=new Map();
const dialogs=()=>[...document.querySelectorAll('dialog.tool-dialog')];
function sync(){document.body.classList.toggle('tool-modal-open',dialogs().some(d=>d.open));}
function closeAll(restore=true){dialogs().forEach(d=>{if(d.open){if(!restore)triggers.delete(d);d.close();}});}
function open(id,trigger=document.activeElement){
 const dialog=document.getElementById(id);if(!dialog||dialog.open)return;
 closeAll(false);triggers.set(dialog,trigger);dialog.showModal();sync();dialog.dispatchEvent(new Event('tool-open'));
}
for(const dialog of dialogs()){
 let backdropStart=false;
 const outside=e=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
 dialog.addEventListener('pointerdown',e=>{backdropStart=e.target===dialog&&outside(e);});
 dialog.addEventListener('click',e=>{if(backdropStart&&e.target===dialog&&outside(e))dialog.close();backdropStart=false;});
 dialog.addEventListener('close',()=>{sync();const trigger=triggers.get(dialog);if(trigger?.isConnected)trigger.focus({preventScroll:true});});
}
document.addEventListener('click',e=>{const close=e.target.closest('[data-dialog-close]'),launch=e.target.closest('[data-open-dialog]');if(close)close.closest('dialog')?.close();if(launch)open(launch.dataset.openDialog,launch);});
window.ToolDialogs={open,closeAll};
})();
