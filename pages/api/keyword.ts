import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import Domain from '../../database/models/domain';
import parseKeywords from '../../utils/parseKeywords';
import verifyUser from '../../utils/verifyUser';
import { computeCompetitorSnapshot } from '../../utils/competitors';
import { parseCompetitorsList } from '../../utils/competitorsShared';

type KeywordGetResponse = {
   keyword?: KeywordType | null
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const authorized = verifyUser(req, res);
   if (authorized === 'authorized' && req.method === 'GET') {
      await db.sync();
      return getKeyword(req, res);
   }
   return res.status(401).json({ error: authorized });
}

const getKeyword = async (req: NextApiRequest, res: NextApiResponse<KeywordGetResponse>) => {
   if (!req.query.id && typeof req.query.id !== 'string') {
       return res.status(400).json({ error: 'Keyword ID is Required!' });
   }

   try {
      const query = { ID: parseInt((req.query.id as string), 10) };
      const foundKeyword:Keyword| null = await Keyword.findOne({ where: query });
      const pareseKeyword = foundKeyword && parseKeywords([foundKeyword.get({ plain: true })]);
      let keywordData = pareseKeyword && pareseKeyword[0] ? pareseKeyword[0] : null;
      if (keywordData) {
         const domainRecord = await Domain.findOne({ where: { domain: keywordData.domain } });
         const competitorsList = parseCompetitorsList(domainRecord?.competitors || null);
         if (competitorsList.length > 0 && Array.isArray(keywordData.lastResult)) {
            keywordData = {
               ...keywordData,
               competitors: computeCompetitorSnapshot(keywordData.lastResult, competitorsList),
            };
         }
         const results = Array.isArray(keywordData.lastResult) ? keywordData.lastResult : [];
         if (results.length > 0) {
            const primaryResult = results.find((item) => item?.matchesDomain) || results[0];
            keywordData = {
               ...keywordData,
               metaTitle: primaryResult?.title,
               metaDescription: primaryResult?.snippet,
            };
         }
      }
      return res.status(200).json({ keyword: keywordData });
   } catch (error) {
      console.log('[ERROR] Getting Keyword: ', error);
      return res.status(400).json({ error: 'Error Loading Keyword' });
   }
};
