import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { ApiResponse, HistoryResponse } from '../api-model';
import { NgClass, NgFor, NgStyle } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { Dictionary, find, groupBy, isEmpty } from 'lodash';
import { ApiService } from '../../services/api.service';
import { catchError, retry, throwError, timer } from 'rxjs';

@Component({
  selector: 'app-roster',
  imports: [NgFor, MatGridListModule, NgStyle, NgClass],
  templateUrl: './roster.component.html',
  styleUrl: './roster.component.css',
})
export class RosterComponent implements OnInit {

  @Input()
  set rosters(value: ApiResponse[]) {
    if (isEmpty(value))
      return;

    this.getHistory();
    this.groupByRosterName(value)
  }

  rosterNames: string[] = []
  groupedData: Dictionary<ApiResponse[]> = {}
  charactersHistory: HistoryResponse[] = [];
  plainRosterData: ApiResponse[] = [];
  filteredHistory: HistoryResponse[] = [];
  averageRosterLevel: any = {};
  currentFilter: string = 'weekly';
  currentRosterFilter: string = 'Highest';

  filterRoster = {
    Highest: [''],
    Average: [''],
    Lowest: [''],
  }

  // Banner img src
  banner: any = {
    Madeline: 'https://cdn.discordapp.com/banners/151149364956495873/120c0aeb7ec87602c0a6c5f7e2ff4d09.png?size=480',
    Syron: 'https://cdn.discordapp.com/banners/209351855338160129/a_6da3f94f6a7066d9ed759edb08188800.gif?size=480',
    Everlasting: 'https://cdn.discordapp.com/banners/231776360253751296/a_df4d57056a385c9e57f7ab9e184d4d43.gif?size=480',
    Compleo: 'https://cdn.discordapp.com/banners/160900248602935296/44d6c4cfafdba7d9c02dd2de2d997893.png?size=480',
    Magnatas: 'https://cdn.discordapp.com/banners/160900248602935296/a_566280575de0b390dd93f501dffe0a77.gif?size=480',
    Siose: 'https://cdn.discordapp.com/banners/160900248602935296/a_59a351757b77fd6bdf4fb9c9d66ab5bd.gif?size=480',
    Taiyakis: 'https://cdn.discordapp.com/banners/160900248602935296/977e7bc9d7f509a538cb41ffd96dfb40.png?size=480',
    Deadlybrother: 'https://cdn.discordapp.com/banners/160900248602935296/a_db9bd4ea98c2725348b62039c1b0a8de.gif?size=480'
  }

  constructor(private api: ApiService, private renderer: Renderer2) { }

  ngOnInit(): void {
  }

  groupByRosterName(value: ApiResponse[]) {
    this.groupedData = groupBy(value, 'RosterName')
    this.rosterNames = Object.keys(this.groupedData)
    this.plainRosterData = value;

    this.precalculateFilterResults();

    console.log('rosterNames', this.rosterNames)
    console.log('groupedData', this.groupedData)
  }

  precalculateFilterResults() {
    this.filterRoster['Highest'] = Object.keys(this.groupedData);
    this.filterRoster['Lowest'] = Object.keys(this.groupedData).reverse();

    const unsortedData = [];
    for (const key in this.groupedData) {
      if (this.groupedData.hasOwnProperty(key)) {
        const group = this.groupedData[key];
        let total: number = 0;
        for (let i = 0; i < group.length; i++) {
          const level: string = group[i].Level.toString();
          total += parseFloat(level);
        }

        unsortedData.push({ name: key, level: Math.round((total / 6) * 100) / 100 })
      }
    }
    unsortedData.sort((a, b) => b.level - a.level)
    unsortedData.forEach(data => {
      this.averageRosterLevel[data.name] = data.level;
    });

    this.filterRoster['Average'] = unsortedData.map(a => (a.name))
  }

  displayClassImg(className: string) {
    return `${className}.png`
  }

  openCharacterInfo(characterName: string) {
    window.open(`https://uwuowo.mathi.moe/character/CE/${characterName}`, '_blank');
  }

  getHistory() {
    this.api.getHistory().pipe(
      retry({
        count: 6,
        delay: (_, retryCount) => {
          console.warn(`Retry attempt #${retryCount} in 5s...`);
          return timer(5000);
        }
      }),
      catchError(error => {
        return throwError(() => new Error('API request failed!'));
      })
    ).subscribe({
      next: (data: HistoryResponse[]) => {
        this.charactersHistory = data;
        this.applyFilter('weekly');
      },
      error: (err) => {
      }
    })
  }

  isCharacterChanged(characterName: string): boolean {
    if (isEmpty(this.charactersHistory))
      return false;

    return !isEmpty(find(this.charactersHistory, { 'CharacterName': characterName }))
  }

  getLevelChanges(characterName: string, isLevelProvided: boolean, currentLevel?: number) {
    if (isEmpty(this.charactersHistory))
      return null;

    const char = find(this.charactersHistory, { 'CharacterName': characterName, 'FilterType': this.currentFilter })
    if (isEmpty(char))
      return null;

    currentLevel = currentLevel ?? find(this.plainRosterData, { 'CharacterName': characterName })?.Level ?? 0;

    const levelIncreasedBy = (currentLevel! - char.Level).toFixed(2)
    return `+${levelIncreasedBy}`;
  }

  onFilterChange(filterType: string) {
    this.currentFilter = filterType;
    this.applyFilter(filterType);
  }

  private applyFilter(filterType: string) {
    this.filteredHistory = this.charactersHistory.filter(data => (data.FilterType == filterType));
  }

  addHighlightClass(characterName: string) {
    const el = document.getElementById(characterName);
    if (el) {
      this.renderer.addClass(el, 'highlight');
      setTimeout(() => {
        this.renderer.removeClass(el, 'highlight');
      }, 4000);
    }
  }

  onRosterFilterChange(filterType: string) {
    this.currentRosterFilter = filterType;
    switch (filterType) {
      case 'Highest':
        this.rosterNames = this.filterRoster['Highest'];
        break;
      case 'Average':
        this.rosterNames = this.filterRoster['Average'];
        break;
      case 'Lowest':
        this.rosterNames = this.filterRoster['Lowest'];
        break;
      default:
        break;
    }
  }
}
