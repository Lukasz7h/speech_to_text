import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../app.service';

import { NotesService } from '../notesService/notes.service';
import { UserExitFromPageService } from './userExit/user-exit-from-page.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements AfterViewInit, OnInit
{
  constructor(
    public notesService: NotesService,
    private appService: AppService,
    private userExitService: UserExitFromPageService,
    private changeDetRef: ChangeDetectorRef
  ){}

  @ViewChild("a4")
  element: ElementRef;

  ngOnInit()
  {
    this.notesService.setSettings();
  }
  
  ngAfterViewInit(): void
  {
    this.changeDetRef.detach();

    const notesText = document.getElementById("notesText");
    this.notesService.a4 = notesText;

    this.subscribeSettigs(notesText);
    this.notesService.listenUser(notesText);

    this.notesService.notesSettingsSubject.subscribe((data: []) => {
      if(!data || data == null) return;

      data.forEach((e) => {
        const entries = Object.entries(e)[0];
        
        this.notesService.settings[`${entries[0]}`] = entries[1]; 
        this.updateView(notesText, entries);
      })
    });
    
    window.addEventListener("beforeunload", () => this.userExitService.userExit({settings: this.notesService.settings, notes: notesText.textContent}));
    
    setTimeout(() => {
      this.changeDetRef.reattach();
      this.appService.getCoordsLocalStorage(this.notesService.settings.padding);
    }, 0);
    
  }

  bottomPadding(notesText: HTMLElement, paddingBottom: number)
  {
    const a4Height = this.element.nativeElement.offsetHeight;
    let totalHeightOfAllDivs = 0;

    const emptyDives = [];

    Array.from(notesText.getElementsByTagName("div"))
    .forEach((element: HTMLElement) => {
      totalHeightOfAllDivs += element.offsetHeight;
      if(element.textContent.length == 0) emptyDives.push(element);
    });

    const result = a4Height - (totalHeightOfAllDivs + this.notesService.settings.padding.Top);

    if(result < paddingBottom)
    {
      for(var i=emptyDives.length-1; i>=0; i--)
      {
          const knit = emptyDives[i].offsetHeight - (paddingBottom - result);
          emptyDives[i].style.height = knit > 0? knit + "px": "0px";
          
          break;
      };

      if(emptyDives[i] && emptyDives[i].offsetHeight == 0) emptyDives[i].remove();
    };
  }

  subscribeSettigs(notesText: HTMLElement): void
  {
    this.appService.settingsSubject.subscribe((data) => {

      const entries = Object.entries(data)[0];
      this.notesService.settings.padding[`${entries[0]}`] = entries[1];

      if(entries[0] == "Bottom")
      {
        this.bottomPadding(notesText, entries[1]);
        return;
      };

      notesText.style[`padding${entries[0]}`] = `${entries[1]}px`;
    })
  }


  updateView(notesText: HTMLElement, attribute: object): void
  {
    if(attribute[1] instanceof Object)
    {
      for(let key in attribute[1])
      {
        this.updateView(notesText, [`${attribute[0]+key}`, attribute[1][key]]);
      }
    };

    isNaN(Number(attribute[1])) && attribute[0] in notesText.style?
    notesText.style[`${attribute[0]}`] = attribute[1]:
    notesText.style[`${attribute[0]}`] = attribute[1] + "px";
  }

  createDocument(type): void
  {
    switch(type)
    {
      case "pdf": this.notesService.createPDF();
      break;
      case "docx": this.notesService.createDOCX();
      break;
    }
  }
}
