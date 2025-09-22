import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import verifyUser from '../../utils/verifyUser';
import parseKeywords from '../../utils/parseKeywords';
import { isKeywordSortOrderSupported } from '../../utils/keywordSortOrder';

const isValidSortValue = (value: unknown): value is number => {
   if (typeof value === 'number' && Number.isFinite(value)) {
      return true;
   }
   if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return !Number.isNaN(parsed);
   }
   return false;
};

const normalizeSortValue = (value: unknown): number => {
   if (typeof value === 'number') { return Math.floor(value); }
   if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!Number.isNaN(parsed)) { return parsed; }
   }
   return 0;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }

   if (req.method !== 'PUT') {
      return res.status(405).json({ error: 'Method Not Allowed' });
   }

   const supportsSortOrder = await isKeywordSortOrderSupported();
   if (!supportsSortOrder) {
      return res.status(400).json({ error: 'Custom keyword ordering is not available. Run the latest database migrations and restart the server.' });
   }

   const { sortOrder } = req.body || {};
   if (!sortOrder || typeof sortOrder !== 'object') {
      return res.status(400).json({ error: 'A valid sortOrder payload is required.' });
   }

   const keywordIDs: number[] = [];
   const updates: { id: number, position: number }[] = [];

   Object.keys(sortOrder).forEach((key) => {
      const id = parseInt(key, 10);
      const value = sortOrder[key];
      if (!Number.isNaN(id) && isValidSortValue(value)) {
         const normalized = normalizeSortValue(value);
         keywordIDs.push(id);
         updates.push({ id, position: normalized });
      }
   });

   if (keywordIDs.length === 0) {
      return res.status(400).json({ error: 'No valid keyword IDs found in payload.' });
   }

   try {
      await db.transaction(async (transaction) => {
         const keywordsToUpdate = await Keyword.findAll({
            where: { ID: { [Op.in]: keywordIDs } },
            transaction,
         });

         const keywordsByDomain: Record<string, { id: number, order: number }[]> = {};

         keywordsToUpdate.forEach((keyword) => {
            const plain = keyword.get({ plain: true }) as KeywordType & { sort_order?: number };
            if (!keywordsByDomain[plain.domain]) {
               keywordsByDomain[plain.domain] = [];
            }
            const targetOrder = updates.find((item) => item.id === plain.ID);
            if (targetOrder) {
               keywordsByDomain[plain.domain].push({ id: plain.ID, order: targetOrder.position });
            }
         });

         await Promise.all(Object.values(keywordsByDomain).map(async (entries) => {
            const sortedEntries = entries.sort((a, b) => a.order - b.order);
            for (let index = 0; index < sortedEntries.length; index += 1) {
               const entry = sortedEntries[index];
               const finalOrder = typeof entry.order === 'number' ? entry.order : index + 1;
               await Keyword.update({ sort_order: finalOrder }, { where: { ID: entry.id }, transaction });
            }
         }));
      });

      const updatedKeywords = await Keyword.findAll({ where: { ID: { [Op.in]: keywordIDs } } });
      const formattedKeywords = parseKeywords(updatedKeywords.map((el) => el.get({ plain: true })));
      return res.status(200).json({ keywords: formattedKeywords });
   } catch (error) {
      console.log('[ERROR] Updating keyword order', error);
      return res.status(400).json({ error: 'Could not update keyword order.' });
   }
 }
