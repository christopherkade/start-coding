import { Injectable } from '@angular/core';
import { FirebaseApp } from 'angularfire2';
import { Documentation } from '../model/documentation';
import { Keywords } from '../model/keyword';
import { QuizService } from './quiz.service';

// Handles Documentation / Resource related matters
@Injectable()
export class DocService {

  // Database references
  dbRef = this.firebase.database().ref().child('documentation');
  dbRefType = this.firebase.database().ref().child('documentation-type');
  // List of doc
  documentation: Documentation[] = [];
  documentationType: Set<string> = new Set();
  documentationTech: Set<string> = new Set();
  isLoading = false;

  constructor(private firebase: FirebaseApp) { }

  resetDoc() {
    this.documentation = [];
  }

  // Fill up a set of available tech from our documentation
  getDocTech() {
    this.documentationTech.add('All')
    this.documentation.map(doc => {
      for (let i = 0; i < doc.tech.length; i++) {
        this.documentationTech.add(doc.tech[i].charAt(0).toUpperCase() + doc.tech[i].slice(1));
      }
    });
  }

  // Get documentation types
  getDocTypes() {
    let docTypes = null;
    this.documentationType.add('All');
    this.dbRefType.on('value', snap => {
      docTypes = snap.val();
      for (let i = 0; i < docTypes.length; i++) {
        // Set the first letter to upper case
        this.documentationType.add(docTypes[i].charAt(0).toUpperCase() + docTypes[i].slice(1));
      }
    });
  }

  // Saves all documentation in our database
  getDoc() {
    let doc = null;
    this.documentation = [];
    this.isLoading = true;
    // query our database
    this.dbRef.on('value', snap => {
      doc = snap.val();
      // go through each doc
      for (const key in doc) {
        if (doc.hasOwnProperty(key)) {
          // save it in our array
          this.documentation.push(new Documentation(doc[key].URL, doc[key].level,
            doc[key].name, doc[key].tech, doc[key].type, doc[key].description))
        }
      }
      this.isLoading = false;
      this.getDocTech();
    });
  }

  // TODO: Drastically improve performance, O(N^3) is not acceptable
  // TODO: Doc should rely on level
  // Saves documentation based on keywords given as parameter
  getDocByKeywords(keywords: Keywords[]) {
    this.isLoading = true;
    let doc = null;

    this.dbRef.on('value', snap => {
      doc = snap.val();

      // For every resource
      for (const key in doc) {
        if (doc.hasOwnProperty(key)) {
          const val = doc[key];

          // For every tech type in this resource
          for (const techKey in val.tech) {
            if (val.tech.hasOwnProperty(techKey)) {

              keywords.map(keyword => {
                if (keyword.trim() === val.tech[techKey].trim()) {
                  // It does, save the documentation
                  this.documentation.push(new Documentation(doc[key].URL,
                    doc[key].level, doc[key].name,
                    val.tech[techKey], doc[key].type, doc[key].description));
                }
              });
            }
          }

        }
      }
      this.isLoading = false;
    });
  }
}
