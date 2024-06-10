import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const identifyContact = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).send("Email or phone number is required");
  }

  try {
    const conditions = [];
    let customers:any[] = []
  if (email) {
    conditions.push({
      emails: {
        has: email,
      },
    });
  }

  if (phoneNumber) {
    conditions.push({
      phoneNumbers: {
        has: phoneNumber,
      },
    });
  }
  if(conditions.length != 0) {
    customers = await prisma.customer.findMany({
        where: {
          OR: conditions,
        },
        orderBy: {
            createdAt: 'asc', 
          },
      });
  } 
  if(customers.length == 0) {
    console.log("Creating a primary contact, no prior contact exists")
    const newContact = await prisma.contact.create({
        data: {
          email: email || null,
          phoneNumber: phoneNumber || null,
          linkPrecedence: "primary",
        }
      });
    const emailsArray = newContact.email ? [newContact.email] : [];
    const phoneNumbersArray = newContact.phoneNumber ? [newContact.phoneNumber] : [];
    const newCustomer = await prisma.customer.create({
        data: {
            primaryContactId: newContact.id,
            emails: emailsArray,
            phoneNumbers: phoneNumbersArray
        }
    })
    const { id,createdAt, updatedAt, ...customerWithoutId } = newCustomer;
    return res.status(200).json({
        contact: customerWithoutId
      });
  }
  if(customers.length == 2) {
    const olderCustomer = customers[0]
    const newerCustomer = customers[1]
    const updatePrimaryForNewer = await prisma.contact.update({
        where: {
            id: newerCustomer.primaryContactId
        },
        data: {
            linkedId: olderCustomer.primaryContactId,
            linkPrecedence: "secondary"
        }
    })
    for (const secondaryContactId of newerCustomer.secondaryContactIds) {
        await prisma.contact.update({
          where: { id: secondaryContactId },
          data: {
            linkedId: olderCustomer.primaryContactId,
            linkPrecedence: "secondary",
          },
        });
      }
      const updateOlderCustomer = await prisma.customer.update({
        where: {
            id: olderCustomer.id
        },
        data: {
            emails: [...olderCustomer.emails, ...newerCustomer.emails],
            phoneNumbers: [...olderCustomer.phoneNumbers, ...newerCustomer.phoneNumbers],
            secondaryContactIds: [...olderCustomer.secondaryContactIds, newerCustomer.primaryContactId, ...newerCustomer.secondaryContactIds]
        }
      })
      const deletedCustomer = await prisma.customer.delete({
        where: {
          id: newerCustomer.id,
        },
      });
      const {id,createdAt, updatedAt, ...customerWithoutId} = updateOlderCustomer
      return res.status(200).json({
        contacts: customerWithoutId
      })
  }
    const emailExists = email ? customers[0].emails.includes(email) : true;
  const phoneNumberExists = phoneNumber ? customers[0].phoneNumbers.includes(phoneNumber) : true;
    if (emailExists && phoneNumberExists) {
        const { id, ...customerWithoutId } = customers[0];
        return res.status(200).json({
            contacts: customerWithoutId
        })
      }
      if (emailExists) {
        const newContact = await prisma.contact.create({
            data: {
                email: null,
                phoneNumber: phoneNumber,
                linkPrecedence: "secondary",
                linkedId: customers[0].primaryContactId
              }
        })
        const updatedCustomer = await prisma.customer.update({
            where: { id: customers[0].id },
            data: {
              phoneNumbers: [...customers[0].phoneNumbers, phoneNumber],
              secondaryContactIds: [...customers[0].secondaryContactIds, newContact.id],
            },
          });
          const { id,createdAt, updatedAt, ...customerWithoutId } = updatedCustomer;
        return res.status(200).json({
            contacts: customerWithoutId
        })
      }
    
      if (phoneNumberExists) {
        const newContact = await prisma.contact.create({
            data: {
                email: email,
                phoneNumber: null,
                linkPrecedence: "secondary",
                linkedId: customers[0].primaryContactId
              }
        })
        const updatedCustomer = await prisma.customer.update({
            where: { id: customers[0].id },
            data: {
              emails: [...customers[0].emails, email],
              secondaryContactIds: [...customers[0].secondaryContactIds, newContact.id],
            },
          });
        const { id,createdAt, updatedAt, ...customerWithoutId } = updatedCustomer;
        return res.status(200).json({
            contacts: customerWithoutId
        })
      }
  } catch (error) {
    console.error('Error identifying contact:', error);
    return res.status(500).send("An error occurred while identifying the contact");
  }
};