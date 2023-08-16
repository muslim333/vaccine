import { Component, OnInit } from '@angular/core';
// import { Platform } from '@ionic/angular';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing';
// import {
//   FileTransfer,
//   FileTransferObject,
// } from '@awesome-cordova-plugins/file-transfer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { IChildVisit, IVisit } from '../pastvisit/pastvisit';
import { LocalStorageService } from '../services/localstorage.service';
// import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
// import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
// import { FilePath } from '@awesome-cordova-plugins/file-path/ngx';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { Platform } from '@ionic/angular';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Child as IChild } from '../advancesearch/advancesearch.page';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

interface Ischool {
  name: string;
}
@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {
  childs: IChild[] = [];
  searchQuery: string = '';
  searchResults: IChild[] = [];
  selectedChilds: IChild[] = [];
  childArray: any[] = [];
  showClearSearchButton: boolean = false;
  showNoStudentMsg = false;
  noChildFound: boolean = false;
  pdfObject = null;

  constructor(
    private file: File, // private androidPermissions: AndroidPermissions, // private fileTransfer: FileTransfer, // private filePath: FilePath,  // private platform: Platform
    private _storage: LocalStorageService,
    private plt: Platform,
    private fileOpener: FileOpener
  ) {}
  formateDate(dateString: string) {
    const date = new Date(dateString);
    const formattedDate = format(date, 'd, MMMM yyyy', { locale: enGB });
    return formattedDate;
  }
  searchItems() {
    this.searchResults = this.childs.filter((child) =>
      child.childName.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    if (this.searchResults.length === 0) {
      this.noChildFound = true;
      this.showClearSearchButton = true;
    } else {
      this.noChildFound = false;
    }

    this.showClearSearchButton = true;
  }

  clearSearch() {
    this.searchQuery = '';
    this.selectedChilds = [];
    this.searchResults = [];
    this.showClearSearchButton = false;
    this.showNoStudentMsg = false;
    this.noChildFound = false;
  }
  ngOnInit() {
    //@ts-ignore
    const storedChilds = JSON.parse(localStorage.getItem('childs')) || [];
    this.childs = storedChilds;
  }

  onChildClick(child: IChild) {
    //@ts-ignore
    const storedChilds = JSON.parse(localStorage.getItem('childs')) || [];
    this.selectedChilds = storedChilds.filter(
      (ch: IChild) => ch.childName === child.childName
    );
    this.searchResults = [];
    // After populating searchResults array
    this.showClearSearchButton = true;
    if (this.selectedChilds.length === 0) {
      this.showNoStudentMsg = true;
      this.noChildFound = true;
    } else {
      this.showNoStudentMsg = false;
      this.noChildFound = false;
    }
  }

  onDownload(child: IChild) {
    // const childVisit: IChildVisit[] = this._storage.getItem(child.id);
    // console.log(childVisit);
    // if (childVisit.length > 1) {
    //   const lastIndex = childVisit.length - 1;
    //   this.createAndWriteCSVOfSingleChild(childVisit[lastIndex]);
    // } else {
    //   this.createAndWriteCSVOfSingleChild(childVisit[0]);
    // }

    this.createPdf(child.id);
  }

  convertObjectToCSV(object: IChildVisit): string {
    const keys = Object.keys(object);
    const header = keys.join(', ');
    //@ts-ignore
    const values = keys.map((key) => object[key]);
    const row = values.map((value) => `"${value}"`).join(', ');

    return `${header}\n${row}`;
  }

  createAndWriteCSVOfSingleChild(child: IChildVisit) {
    const fileName = Date.now().toString() + 'data.csv';
    const csvString = this.convertObjectToCSV(child);

    const dataDirectory = this.file.dataDirectory;

    this.file
      .writeFile(dataDirectory, fileName, csvString, { replace: true })
      .then(() => {
        const filePath = dataDirectory + fileName;
        const message = 'child' + ' CSV file downloaded successfully.';

        // Share the CSV file using SocialSharing
        SocialSharing.share(undefined, undefined, filePath, message)
          .then(() => {
            console.log('CSV file shared successfully.');
          })
          .catch((error: any) => {
            console.error('Error sharing CSV file:', error);
          });
      })
      .catch((error: any) => {
        console.error('Error creating and writing CSV file:', error);
      });
  }
  createAndWriteCSV(child: IChild[]) {
    const fileName = Date.now().toString() + 'data.csv';
    const csvString = this.convertArrayToCSV(child);

    if (this.plt.is('cordova')) {
      // Save the CSV file on the device using @awesome-cordova-plugins/file
      const dataDirectory = this.file.dataDirectory;
      this.file
        .writeFile(dataDirectory, fileName, csvString, { replace: true })
        .then(() => {
          const filePath = dataDirectory + fileName;
          const message = 'Childs ' + ' CSV file downloaded successfully.';

          // Share the CSV file using SocialSharing
          SocialSharing.share(undefined, undefined, filePath, message)
            .then(() => {
              console.log('CSV file shared successfully.');
            })
            .catch((error: any) => {
              console.error('Error sharing CSV file:', error);
            });
        })
        .catch((error: any) => {
          console.error('Error creating and writing CSV file:', error);
        });
    } else {
      // For non-Cordova platforms (e.g., web), trigger the download
      this.downloadCSV(csvString, fileName);
    }
  }

  // Function to trigger the CSV download for non-Cordova platforms (e.g., web)
  private downloadCSV(csvString: string, fileName: string) {
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    // Optionally, you can revoke the object URL after the download link is clicked.
    URL.revokeObjectURL(url);
  }

  showNoChildMsg(): boolean {
    return this.childs.length === 0 ? true : false;
  }

  BulkChildDownload(selectedChilds: IChild[]) {
    this.createAndWriteCSV(selectedChilds);
  }

  convertArrayToCSV(objects: any[]): string {
    if (objects.length === 0) {
      return ''; // Return an empty string if the array is empty
    }

    const flattenObject = (obj) => {
      const flattened = {};

      const flatten = (currentObj, propName = '') => {
        for (let key in currentObj) {
          if (currentObj.hasOwnProperty(key)) {
            if (key === 'visits' || key === 'id') continue; // Ignore the 'visits' property
            if (key === 'earWax' && Array.isArray(currentObj[key])) {
              currentObj[key] = currentObj[key].join(',');
            }

            const newKey = propName ? `${propName}.${key}` : key;

            if (Array.isArray(currentObj[key])) {
              for (let i = 0; i < currentObj[key].length; i++) {
                flatten(currentObj[key][i], `${newKey}[${i + 1}]`); // Start index from 1
              }
            } else if (typeof currentObj[key] === 'object') {
              flatten(currentObj[key], newKey);
            } else {
              flattened[newKey] = currentObj[key];
            }
          }
        }
      };

      flatten(obj);

      return flattened;
    };

    const flattenedObjects = objects.map((object) => flattenObject(object));

    const keys = Object.keys(flattenedObjects[0]);
    const header = keys.join(',');

    const rows = flattenedObjects.map((object) => {
      const values = keys.map((key) => object[key]);
      return values.map((value) => `"${value}"`).join(', ');
    });

    return `${header}\n\n${rows.join('\n\n\n')}`;
  }

  isPrintable(child: IChild): boolean {
    const childData: IChildVisit[] = this._storage.getItem(child.id);
    return childData.length > 0 ? false : true;
  }

  async createPdf(childId: string) {
    // const childVisit: IChildVisit = this._storage.getItem(childId);
    const childArray: IChild[] = this._storage.getItem('childs');
    const childDetails: IChild = childArray.find(
      (child) => child.id === childId
    );
    // console.log(childVisit);
    // if (childVisit.length > 1) {
    //   const lastIndex = childVisit.length - 1;
    //   this.createAndWriteCSVOfSingleChild(childVisit[lastIndex]);
    // } else {
    //   this.createAndWriteCSVOfSingleChild(childVisit[0]);
    // }
    let firstEntryDate = '';
    let UpdatedVisitsArray = [];
    if (childDetails.lastFiveVisits.length > 1) {
      UpdatedVisitsArray = childDetails.lastFiveVisits.sort((a, b) => {
        //@ts-ignore
        const dateA = new Date(a.date);
        //@ts-ignore
        const dateB = new Date(b.date);
        //@ts-ignore
        return dateB - dateA;
      });
    } else {
      UpdatedVisitsArray = childDetails.lastFiveVisits;
    }
    const VisitsArray = UpdatedVisitsArray.map((visit: IVisit, index) => {
      if (index === 0) {
        firstEntryDate = visit.date;
      }

      const weightPart = {
        text: visit.weight || '',
        alignment: 'center',
      };

      const weightRangePart = {
        text: `(${
          Number(visit.weight) > 5
            ? (Number(visit.weight) - 4).toFixed(1)
            : (Number(visit.weight) - 1).toFixed(1)
        }-${(Number(visit.weight) + 2).toFixed(1)})`,
        alignment: 'center',
        fontSize: 7,
        bold: true,
      };

      const heightPart = {
        text: visit.height || '',
        alignment: 'center',
      };

      const heightRangePart = {
        text: `(${(Number(visit.height) - this.randomNo()).toFixed(1)}-${(
          Number(visit.height) + 5
        ).toFixed(1)})`,
        alignment: 'center',
        fontSize: 7,
        bold: true,
      };

      const bmiPart = {
        text: visit.bmi || '',
        alignment: 'center',
      };

      const bmiRangePart = {
        text: `(${Math.floor(Number(visit.bmi) - 2)}-${Math.floor(
          Number(visit.bmi) + 3
        )})`,
        alignment: 'center',
        fontSize: 7,
        bold: true,
      };

      const growthVelocityPart = {
        text: visit.growthVelocity.split('-')[0] || '',
        bold: visit.growthVelocity.includes('-') ? true : false,
        alignment: 'center',
      };

      const growthVelocityRangePart = {
        text: visit.growthVelocity.split('-')[1],
        bold: visit.growthVelocity.includes('-') ? true : false,
        fontSize: 7,
        alignment: 'center',
      };

      const muacPart = {
        text: visit.muac || '',
        alignment: 'center',
      };

      const muacRangePart = {
        text: `(${Number(visit.muac) - 4}-${Number(visit.muac) + 3})`,
        alignment: 'center',
        fontSize: 7,
        bold: true,
      };

      return [
        { text: visit.date || '' },
        { stack: [weightPart, weightRangePart] },
        { stack: [heightPart, heightRangePart] },
        { stack: [bmiPart, bmiRangePart] },
        {
          stack: [growthVelocityPart, growthVelocityRangePart]
        },
        { stack: [muacPart, muacRangePart] },
      ];
    });
    console.log('visit array', VisitsArray);
    const docDef = {
      content: [
        {
          columns: [
            {
              width: '*',
              text: 'Healthcare | Emergency | Vaccines',
              decoration: 'underline',
            },
            {
              width: '*',
              table: {
                widths: ['*', '*'], // Adjust the column widths as needed
                body: [
                  [
                    {
                      image: await this.getBase64ImageFromURL(
                        '../../assets/HomeNursing.PNG'
                      ),
                      width: 100,
                      height: 40,
                      alignment: 'center',
                      border: [false, false, false, false], // Remove border around the cell
                      margin: [0, -20, -13, 20],
                    },
                    {
                      text: 'Metacare',
                      bold: true,
                      fontSize: 20,
                      alignment: 'center',
                      border: [false, false, false, false], // Remove border around the cell
                      margin: [0, 0, 45, 20],
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: function (i, node) {
                  return i === 0 || i === node.table.body.length ? 0 : 1; // Remove the horizontal lines between rows
                },
                vLineWidth: function (i) {
                  return 0; // Remove the vertical lines within the table
                },
                paddingLeft: function (i) {
                  return i === 0 ? 0 : 8; // Add padding to the left of the second column
                },
                paddingRight: function (i) {
                  return i === 0 ? 0 : 8; // Add padding to the right of the first column
                },
              },
            },
          ],
        },
        {
          text: "KID'S GROWTH AND GENERAL HEALTH ASSESSMENT",
          style: 'header',
          alignment: 'center',
          bold: true,
          fontSize: 18,
          margin: [0, 0, 0, 3], // Add a 10px bottom margin
        },
        {
          text: `Date of Latest Assessment : ${this.formateDate(
            firstEntryDate
          )}`,
          style: 'header',
          alignment: 'center',
          bold: true,
          fontSize: 10,
          margin: [0, 0, 0, 20], // Add a 10px bottom margin
        },
        {
          style: 'childTable',
          table: {
            widths: ['*', '*'], // Set both columns to have equal width
            body: [
              [
                `${childDetails.childName} ${
                  childDetails.gender === 'male' ? '  S/O  ' : '  D/O  '
                } ${childDetails.fatherName}`,
                `DOB: ${this.formateDate(childDetails.dateOfBirth)}`,
              ],
            ],
          },
          margin: [0, 0, 0, 10], // Add a 10px bottom margin
        },
        {
          style: 'childTable',
          table: {
            widths: ['auto', '*', '*', '*', '*', '*'],
            body: [
              [
                {
                  text: 'Date',
                  bold: true,
                  alignment: 'center',
                  border: [true, true, true, false],
                },
                {
                  text: 'Weight',
                  bold: true,
                  alignment: 'center',
                  border: [false, true, true, false],
                },
                {
                  text: 'Height',
                  bold: true,
                  alignment: 'center',
                  border: [false, true, true, false],
                },
                {
                  text: 'BMI',
                  bold: true,
                  alignment: 'center',
                  border: [false, true, true, false],
                },
                {
                  text: 'Growth Velocity',
                  fontSize: 11,
                  alignment: 'center',
                  bold: true,
                  border: [false, true, true, false],
                },
                {
                  text: 'MUAC',
                  bold: true,
                  alignment: 'center',
                  border: [false, true, true, false],
                },
              ],
              [
                {
                  text: '',
                  bold: true,
                  alignment: 'center',
                  border: [true, false, true, false],
                },
                {
                  text: '(kg)',
                  bold: true,
                  fontSize: 9,
                  alignment: 'center',
                  border: [false, false, true, false],
                },
                {
                  text: '(cm)',
                  bold: true,
                  fontSize: 9,
                  alignment: 'center',
                  border: [false, false, true, false],
                },
                {
                  text: '(kg/m²)',
                  bold: true,
                  fontSize: 9,
                  alignment: 'center',
                  border: [false, false, true, false],
                },
                {
                  text: '(cm/year)',
                  bold: true,
                  fontSize: 9,
                  alignment: 'center',
                  border: [false, false, true, false],
                },
                {
                  text: '(cm)',
                  bold: true,
                  fontSize: 9,
                  alignment: 'center',
                  border: [false, false, true, false],
                },
              ],

              ...VisitsArray,
            ],
          },
          margin: [0, 0, 0, 10], // Add a 10px bottom margin
        },
        {
          style: 'childTable',
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'Ear Wax', bold: true, alignment: 'center' },
                { text: 'Vision', bold: true, alignment: 'center' },
                { text: 'Palmar Pallor', bold: true, alignment: 'center' },
              ],
              [
                { text: `${childDetails.earWax}`, alignment: 'center' },
                { text: `${childDetails.vision}`, alignment: 'center' },
                { text: `${childDetails.palmarPallor}`, alignment: 'center' },
              ],
            ],
          },
          margin: [0, 0, 0, 10],
        },
        {
          style: 'childTable',
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                { text: 'DENTAL EXAMINATION', colSpan: 4, bold: true },
                '',
                '',
                '',
              ],
              [
                { text: 'Hygiene', bold: true, alignment: 'center' },
                { text: 'Carries', bold: true, alignment: 'center' },
                { text: 'Gaps', bold: true, alignment: 'center' },
                { text: 'Scaling', bold: true, alignment: 'center' },
              ],
              [
                { text: `${childDetails.hygiene}`, alignment: 'center' },
                { text: `${childDetails.carries}`, alignment: 'center' },
                { text: `${childDetails.gaps}`, alignment: 'center' },
                { text: `${childDetails.scaling}`, alignment: 'center' },
              ],
            ],
          },
          margin: [0, 0, 0, 10],
        },
        {
          style: 'childTable',
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Vaccine', bold: true },
                { text: 'Status', bold: true },
              ],
              ['EPI', `${childDetails.epiStatus}`],
              ['Typhoid', `${childDetails.typhoid}`],
              ['Chickenpox', `${childDetails.chickenpox}`],
              ['Hepatitis A', `${childDetails.hepatitisA}`],
              ['MMR', `${childDetails.mmr}`],
              ['Meningitis', `${childDetails.meningitis}`],
            ],
          },
          margin: [0, 0, 0, 10],
        },
        {
          style: 'childTable',
          table: {
            widths: ['*'],
            body: [['comments:'], ['  '], ['  '], ['  ']],
          },
          margin: [0, 0, 0, 10],
        },
        {
          style: 'childTable',
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                {
                  text: 'PARTNERS',
                  colSpan: 4,
                  bold: true,
                  alignment: 'center',
                },
                '',
                '',
                '',
              ],
              [
                {
                  image: await this.getBase64ImageFromURL(
                    '../../assets/Vaccine.png'
                  ),
                  width: 120,
                  height: 50,
                  alignment: 'center',
                },
                {
                  image: await this.getBase64ImageFromURL(
                    '../../assets/HomeNursing.PNG'
                  ),
                  width: 120,
                  height: 50,
                  alignment: 'center',
                },
                {
                  image: await this.getBase64ImageFromURL(
                    '../../assets/SmileResort.PNG'
                  ),
                  width: 120,
                  height: 50,
                  alignment: 'center',
                },
                {
                  image: await this.getBase64ImageFromURL(
                    '../../assets/BabyMedics.png'
                  ),
                  width: 120,
                  height: 50,
                  alignment: 'center',
                },
              ],
              [
                { text: 'Vaccine.pk', alignment: 'center' },
                { text: 'HomeNursing.pk', alignment: 'center' },
                { text: 'SmileResort.com', alignment: 'center' },
                { text: 'BabyMedics.com', alignment: 'center' },
              ],
            ],
          },
          margin: [0, 0, 0, 5],
        },

        {
          style: 'childTable',
          table: {
            widths: ['auto', '*', 'auto', '*', 'auto', '*'],
            body: [
              [
                {
                  image: await this.getBase64ImageFromURL(
                    '../../assets/icon1.PNG'
                  ),
                  fit: [20, 20],
                },
                { text: '051 5735006', alignment: 'center' },
                {
                  image: await this.getBase64ImageFromURL(
                    '../../assets/icon2.PNG'
                  ),
                  fit: [20, 20],
                },
                { text: 'info.metacare.pk', alignment: 'center' },
                {
                  image: await this.getBase64ImageFromURL(
                    '../../assets/icon3.PNG'
                  ),
                  fit: [20, 20],
                },
                { text: 'Metacare.pk', alignment: 'center' },
              ],
              [
                {
                  text: 'Main PWD Road, National Police Foundation Islamabad',
                  colSpan: 6,
                  alignment: 'center',
                },
                '',
                '',
                '',
                '',
                '',
              ],
            ],
          },
        },
      ],
    };

    this.pdfObject = pdfMake.createPdf(docDef);
    if (this.plt.is('cordova')) {
      try {
        const pdfDocGenerator = pdfMake.createPdf(docDef);

        // Generate the PDF as a data URL
        const pdfAsDataUrl = await this.getPdfAsDataUrl(pdfDocGenerator);

        // Generate a unique file name
        const fileName =
          Date.now().toString() + ' ' + childDetails.childName + '.pdf';

        // Get the device's data directory
        const dataDirectory = this.file.dataDirectory;

        // Convert the data URL to Blob
        const pdfBlob = this.dataURLToBlob(pdfAsDataUrl);

        const fileEntry = await this.file.writeFile(
          dataDirectory,
          fileName,
          pdfBlob,
          { replace: true }
        );
        await this.fileOpener.open(fileEntry.nativeURL, 'application/pdf');
      } catch (error) {
        console.log('some thing wrong with opening the file', error);
      }
      // });
    } else {
      this.pdfObject.download(`${childDetails.childName}.pdf`);
    }
  }

  getPdfAsDataUrl(pdfDocGenerator: any): Promise<string> {
    return new Promise((resolve, reject) => {
      pdfDocGenerator.getBase64((dataUrl: string) => {
        resolve(dataUrl);
      });
    });
  }

  dataURLToBlob(dataUrl: string): Blob {
    console.log(dataUrl); // Add this line to check the value

    const binaryString = window.atob(dataUrl);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes.buffer], { type: 'application/pdf' });
  }

  getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');

      img.onload = () => {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        var dataURL = canvas.toDataURL('image/png');

        resolve(dataURL);
      };

      img.onerror = (error) => {
        reject(error);
      };

      img.src = url;
    });
  }
  randomNo() {
    return Math.floor(Math.random() * 9) + 1;
  }
}
