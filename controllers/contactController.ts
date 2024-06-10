import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'; // Adjust the import based on your project structure
const prisma = new PrismaClient();
export const identifyContact = async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body;
    console.log(req.body, "printing body");
    
    if (!email && !phoneNumber) {
      return res.status(400).send("Email or phone number is required");
    }
  
    try {
        let contacts
        let contactDetail
        let secondaryFlag = false
        let primaryUpdateFlag = false
        if(email && phoneNumber) {
            contacts = await prisma.contact.findMany({
                where: {
                    OR: [
                      { email: email },
                      { phoneNumber: phoneNumber }
                    ]
                  }
            })
            const contactDetail = await prisma.contact.findFirst({
                where: {
                  AND: [
                    { email: email },
                    { phoneNumber: phoneNumber }
                  ]
                }
              });
            if(!contactDetail) {
                console.log("Secondary flag activated", contactDetail, contacts)
                secondaryFlag = true
            }

        } 
        else if(email)
        {
            contacts = await prisma.contact.findMany({
            where: {
                email: email
            }
        })}
        else {
            contacts = await prisma.contact.findMany({
                where: {
                    phoneNumber: phoneNumber
                }
            })
        }
      let primaryContact;
      let secondaryContacts:any[] = [];
      let emails = [];
      let phoneNumbers = [];
      let primaryContacts:any[] = [];
      contacts.forEach(contact => {
        if (contact.linkPrecedence === 'primary') {
          if (!primaryContacts.includes(contact.id)) {
            primaryContacts.push(contact.id);
          }
        } else if (contact.linkPrecedence === 'secondary' && contact.linkedId !== null) {
          if (!primaryContacts.includes(contact.linkedId)) {
            primaryContacts.push(contact.linkedId);
          }
        }
      });
      if (primaryContacts.length > 0) {
        if(primaryContacts.length == 2) {
            const newPrimaryContact = await prisma.contact.findFirst({
                where: {
                    email: email
                }
            })
            if(!newPrimaryContact) {
                return res.status(501).json({
                    error: true
                })
            }
            primaryContacts.filter(contact => contact !== newPrimaryContact.id);
            const newSecondaryContact = await prisma.contact.update({
                where: {
                    id: primaryContacts[0]
                },
                data: {
                    linkedId: newPrimaryContact.id,
                    linkPrecedence: "primary"
                }
            })
            const updatedContacts = await prisma.contact.updateMany({
                where: {
                  linkedId: newSecondaryContact.id
                },
                data: {
                  linkedId: newPrimaryContact.id
                }
              });
              primaryContacts[0] = newPrimaryContact.id
              primaryUpdateFlag = true
        }
            primaryContact = await prisma.contact.findUnique(
                {where: {
                    id: primaryContacts[0]
                }}
            )
            contacts = await prisma.contact.findMany({
                where: {
                    linkedId: primaryContacts[0]
                }
            })
            console.log(primaryContact, contacts, "Checking final")
            if(!primaryContact) {
                console.log("Some issue with primary contact id")
                return res.status(501).json({
                    error: true,
                })
            }
            emails.push(primaryContact.email);
            phoneNumbers.push(primaryContact.phoneNumber);
            
            for (let i = 0; i < contacts.length; i++) {
              if (contacts[i].id !== primaryContact.id) {
                secondaryContacts.push(contacts[i].id);
              }
              if (contacts[i].email && !emails.includes(contacts[i].email)) {
                emails.push(contacts[i].email);
              }
              if (contacts[i].phoneNumber && !phoneNumbers.includes(contacts[i].phoneNumber)) {
                phoneNumbers.push(contacts[i].phoneNumber);
              }
            }
            console.log(email && phoneNumber, "checking condition")
            if (secondaryFlag && !primaryUpdateFlag) {
              console.log("Creating secondary contact for unmatched email and phone number combination");
              const newContact = await prisma.contact.create({
                data: {
                  email: email || null,
                  phoneNumber: phoneNumber || null,
                  linkPrecedence: "secondary",
                  linkedId: primaryContact.id
                }
              });
              
              secondaryContacts.push(newContact.id);
              if (newContact.email && !emails.includes(newContact.email)) {
                emails.push(newContact.email);
              }
              if (newContact.phoneNumber && !phoneNumbers.includes(newContact.phoneNumber)) {
                phoneNumbers.push(newContact.phoneNumber);
              }
            }
            
            return res.status(200).json({
                contact: {
                  primaryContactId: primaryContact.id,
                  emails: emails.filter(Boolean), // Remove any null values
                  phoneNumbers: phoneNumbers.filter(Boolean), // Remove any null values
                  secondaryContactIds: secondaryContacts
                }
              });
      } else {
        console.log("Creating new primary contact");
        primaryContact = await prisma.contact.create({
          data: {
            email: email || null,
            phoneNumber: phoneNumber || null,
            linkPrecedence: "primary",
          }
        });
        emails.push(email);
        phoneNumbers.push(phoneNumber);
        return res.status(200).json({
            contact: {
              primaryContactId: primaryContact.id,
              emails: emails.filter(Boolean), // Remove any null values
              phoneNumbers: phoneNumbers.filter(Boolean), // Remove any null values
              secondaryContactIds: secondaryContacts
            }
          });
      }
  
      
    } catch (error) {
      console.error('Error identifying contact:', error);
      return res.status(500).send("An error occurred while identifying the contact");
    }
  };
