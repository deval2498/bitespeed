import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'; // Adjust the import based on your project structure

const prisma = new PrismaClient();

export const identifyContact = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).send("Email or phone number is required");
  }

  try {
    let contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined }
        ]
      }
    });

    let contactDetail = email && phoneNumber ? await prisma.contact.findFirst({
      where: {
        AND: [
          { email: email },
          { phoneNumber: phoneNumber }
        ]
      }
    }) : null;

    let secondaryFlag = email && phoneNumber && !contactDetail;
    let primaryContact:any;
    let primaryUpdateFlag = false;
    let primaryContacts: number[] = [];
    let secondaryContacts: number[] = [];
    let emails: string[] = [];
    let phoneNumbers: string[] = [];

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
      if (primaryContacts.length == 2) {
        const newPrimaryContact = await prisma.contact.findFirst({
          where: {
            email: email
          }
        });
        if (!newPrimaryContact) {
          return res.status(501).json({
            error: true
          });
        }
        primaryContacts = primaryContacts.filter(contact => contact !== newPrimaryContact.id);
        const newSecondaryContact = await prisma.contact.update({
          where: {
            id: primaryContacts[0]
          },
          data: {
            linkedId: newPrimaryContact.id,
            linkPrecedence: "secondary"
          }
        });
        await prisma.contact.updateMany({
          where: {
            linkedId: newSecondaryContact.id
          },
          data: {
            linkedId: newPrimaryContact.id
          }
        });
        primaryContacts[0] = newPrimaryContact.id;
        primaryUpdateFlag = true;
      }

      primaryContact = await prisma.contact.findUnique({
        where: {
          id: primaryContacts[0]
        }
      });
      contacts = await prisma.contact.findMany({
        where: {
          linkedId: primaryContacts[0]
        }
      });
      if (!primaryContact) {
        return res.status(501).json({
          error: true,
        });
      }

      emails.push(primaryContact.email);
      phoneNumbers.push(primaryContact.phoneNumber);

      contacts.forEach(contact => {
        if (contact.id !== primaryContact.id) {
          secondaryContacts.push(contact.id);
        }
        if (contact.email && !emails.includes(contact.email)) {
          emails.push(contact.email);
        }
        if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
          phoneNumbers.push(contact.phoneNumber);
        }
      });

      if (secondaryFlag && !primaryUpdateFlag) {
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