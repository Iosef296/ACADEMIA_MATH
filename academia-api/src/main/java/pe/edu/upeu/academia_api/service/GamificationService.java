package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.gamification.ChallengeRequest;
import pe.edu.upeu.academia_api.dto.gamification.ChallengeResponse;
import pe.edu.upeu.academia_api.entity.Badge;
import pe.edu.upeu.academia_api.entity.Ranking;
import pe.edu.upeu.academia_api.entity.Reward;
import pe.edu.upeu.academia_api.entity.UserBadge;

import java.util.List;
import java.util.UUID;

public interface GamificationService {
    List<Badge> findAllBadges();
    List<UserBadge> findMyBadges(UUID userId);
    List<ChallengeResponse> findActiveChallenges();
    ChallengeResponse createChallenge(ChallengeRequest request);
    void submitChallenge(UUID challengeId, UUID userId);
    List<Reward> findAllRewards();
    void useReward(UUID rewardId, UUID userId);
    List<Ranking> getRanking();
    void updateRankingVisibility(UUID userId, boolean visible);
}
